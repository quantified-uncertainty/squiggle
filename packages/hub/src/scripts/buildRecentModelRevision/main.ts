import { PrismaClient } from "@prisma/client";
import { spawn } from "child_process";

import { NotFoundError } from "../../graphql/errors/NotFoundError";
import { WorkerOutput } from "./worker";

const TIMEOUT_SECONDS = 60; // 60 seconds

const prisma = new PrismaClient();

async function runWorker(
  revisionId: string,
  code: string,
  seed: string,
  timeoutSeconds: number
): Promise<WorkerOutput> {
  return new Promise((resolve, _) => {
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
      resolve({ errors: `Timeout Error, at ${timeoutSeconds}s`, exports: [] });
    }, timeoutSeconds * 1000);

    worker.stdout?.on("data", (data) => {
      console.log(`Worker output: ${data}`);
    });

    worker.stderr?.on("data", (data) => {
      console.error(`Worker error: ${data}`);
    });

    worker.on(
      "message",
      async (message: { type: string; data: WorkerOutput }) => {
        console.log("Worker message received");
        resolve(message.data);
      }
    );

    worker.on("exit", (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        console.log("Worker completed successfully");
      } else {
        console.error(`Worker process exited with error code ${code}`);
        resolve({
          errors: "Computation error, with code: " + code,
          exports: [],
        });
      }
    });

    worker.send({ type: "run", data: { code, seed } });
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

async function buildRecentModelVersion(): Promise<void> {
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

    await prisma.$transaction(async (tx) => {
      // For some reason, Typescript becomes unsure if `model.currentRevisionId` is null or not, even though it's checked above.
      const revisionId = model.currentRevisionId!;

      await tx.modelRevisionBuild.create({
        data: {
          modelRevision: { connect: { id: revisionId } },
          runSeconds: (endTime - startTime) / 1000,
          errors: response.errors === undefined ? [] : [response.errors],
        },
      });

      for (const e of response.exports) {
        await tx.modelExport.upsert({
          where: {
            uniqueKey: {
              modelRevisionId: revisionId,
              variableName: e.variableName,
            },
          },
          update: {
            variableType: e.variableType,
            title: e.title,
            docstring: e.docstring,
          },
          create: {
            modelRevision: { connect: { id: revisionId } },
            variableName: e.variableName,
            variableType: e.variableType,
            title: e.title,
            docstring: e.docstring,
          },
        });
      }
    });
    console.log(
      `Build created for model revision ID: ${model.currentRevisionId}, in ${endTime - startTime}ms. Created ${response.exports.length} exports.`
    );
  } catch (error) {
    console.error("Error building model revision:", error);
    throw error;
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

async function main(): Promise<void> {
  try {
    await buildRecentModelVersion();
    await countItemsRemaining();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runContinuously() {
  while (true) {
    try {
      await main();
      await new Promise((resolve) => process.nextTick(resolve));
      await delay(500); // Delay for approximately .5s
    } catch (error) {
      console.error("An error occurred during continuous execution:", error);
    }
  }
}

runContinuously();
