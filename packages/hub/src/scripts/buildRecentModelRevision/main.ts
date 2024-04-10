import { PrismaClient } from "@prisma/client";
import { spawn } from "child_process";

import { NotFoundError } from "../../graphql/errors/NotFoundError";

const TIMEOUT_SECONDS = 60; // 60 seconds

const prisma = new PrismaClient();

type SquiggleResult = {
  errors?: string;
};

async function runWorker(
  revisionId: string,
  code: string,
  seed: string,
  timeoutSeconds: number
): Promise<SquiggleResult> {
  return new Promise((resolve, reject) => {
    console.log("Spawning worker process for Revision ID: " + revisionId);
    const worker = spawn(
      "tsx",
      ["src/scripts/buildRecentModelRevision/worker.ts"],
      {
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      }
    );

    const timeoutId = setTimeout(() => {
      worker.kill();
      resolve({ errors: `Timeout Error, at ${timeoutSeconds}s ` });
    }, timeoutSeconds * 1000);

    worker.stdout?.on("data", (data) => {
      console.log(`Worker output: ${data}`);
    });

    worker.stderr?.on("data", (data) => {
      console.error(`Worker error: ${data}`);
    });

    worker.on(
      "message",
      async (message: { type: string; data: { errors?: string } }) => {
        resolve(message.data);
      }
    );

    worker.on("exit", (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        console.log("Worker completed successfully");
      } else {
        console.error(`Worker process exited with code ${code}`);
        resolve({ errors: "Computation error, with code: " + code });
      }
    });

    worker.send({ type: "run", data: { revisionId, code, seed } });
    worker.on("close", (code) => {
      console.log(`Worker process CLOSED with code ${code}`);
    });
  });
}

async function oldestModelRevisionWithoutBuilds() {
  const modelRevision = await prisma.modelRevision.findFirst({
    where: {
      currentRevisionModel: {
        isNot: null,
      },
      builds: {
        none: {},
      },
      contentType: "SquiggleSnippet",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      model: {
        include: {
          currentRevision: {
            include: {
              squiggleSnippet: true,
            },
          },
        },
      },
    },
  });
  return modelRevision?.model;
}

async function buildRecentModelVersion() {
  try {
    const model = await oldestModelRevisionWithoutBuilds();

    if (!model) {
      console.log("No remaining unbuilt model revisions");
      return;
    }

    if (!model?.currentRevisionId || !model.currentRevision?.squiggleSnippet) {
      throw new NotFoundError(
        `Unexpected Error: Model revision didn't have needed information. This should never happen.`
      );
    }

    const { code, seed } = model.currentRevision.squiggleSnippet;

    const startTime = performance.now();
    let response = await runWorker(
      model.currentRevisionId,
      code,
      seed,
      TIMEOUT_SECONDS
    );
    const endTime = performance.now();
    console.log("RESPONSE", response);

    const build = await prisma.modelRevisionBuild.create({
      data: {
        modelRevision: { connect: { id: model.currentRevisionId } },
        runSeconds: (endTime - startTime) / 1000,
        errors: response.errors === undefined ? [] : [response.errors],
      },
    });

    console.log("Build created:", build);
  } catch (error) {
    console.error(error);
  }
}

async function countItemsRemaining() {
  const remaining = await prisma.modelRevision.count({
    where: {
      currentRevisionModel: {
        isNot: null,
      },
      builds: {
        none: {},
      },
    },
  });

  console.log("Model Revisions Remaining:", remaining);
}

async function main() {
  try {
    buildRecentModelVersion();
    countItemsRemaining();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

try {
  main();
} catch (error) {
  console.error("An unhandled error occurred:", error);
  process.exit(1);
}
