import { spawn } from "node:child_process";

import { PrismaClient } from "@quri/hub-db";
import { checkSquiggleVersion } from "@quri/versioned-squiggle-components";

import { createVariableRevision } from "./createVariableRevision";
import { WorkerOutput, WorkerRunMessage } from "./worker";

const TIMEOUT_SECONDS = 60; // 60 seconds

const prisma = new PrismaClient();

async function runWorker({
  revisionId,
  code,
  seed,
  timeoutSeconds,
  userEmail,
  squiggleVersion,
}: {
  revisionId: string;
  code: string;
  seed: string;
  timeoutSeconds: number;
  userEmail?: string;
  squiggleVersion: string;
}): Promise<WorkerOutput> {
  if (!checkSquiggleVersion(squiggleVersion)) {
    return {
      errors: `Squiggle version ${squiggleVersion} is not a valid Squiggle version.`,
      variableRevisions: [],
    };
  }

  return new Promise((resolve, _) => {
    console.log("Spawning worker process for Revision ID: " + revisionId);
    const worker = spawn("node", [__dirname + "/worker.mjs"], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    });

    const timeoutId = setTimeout(() => {
      worker.kill();
      resolve({
        errors: `Timeout Error, at ${timeoutSeconds}s`,
        variableRevisions: [],
      });
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
          variableRevisions: [],
        });
      }
    });

    worker.send({
      type: "run",
      data: { code, seed, userEmail, squiggleVersion },
    } satisfies WorkerRunMessage);
  });
}

async function oldestModelRevisionWithoutBuilds() {
  const modelRevision = await prisma.modelRevision.findFirst({
    where: {
      builds: {
        none: {},
      },
      contentType: "SquiggleSnippet",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      author: {
        select: {
          email: true,
        },
      },
      squiggleSnippet: true,
    },
  });
  return modelRevision;
}

async function buildRecentModelVersion(): Promise<void> {
  try {
    const modelRevision = await oldestModelRevisionWithoutBuilds();

    if (!modelRevision) {
      console.log("No remaining unbuilt model revisions");
      return;
    }

    if (!modelRevision.squiggleSnippet) {
      // shouldn't happen, we accounted for this in Prisma query
      throw new Error(
        `Unexpected Error: This is not a SquiggleSnippet model revision.`
      );
    }

    const { code, seed, version } = modelRevision.squiggleSnippet;

    // author can be empty on old revisions
    const userEmail = modelRevision.author?.email ?? "";

    const startTime = performance.now();
    const response = await runWorker({
      revisionId: modelRevision.id,
      code,
      seed,
      timeoutSeconds: TIMEOUT_SECONDS,
      userEmail,
      squiggleVersion: version,
    });
    const endTime = performance.now();

    await prisma.$transaction(async (tx) => {
      const revisionId = modelRevision.id;
      const modelId = modelRevision.modelId;

      await tx.modelRevisionBuild.create({
        data: {
          modelRevision: { connect: { id: revisionId } },
          runSeconds: (endTime - startTime) / 1000,
          errors: response.errors === undefined ? [] : [response.errors],
        },
      });

      for (const e of response.variableRevisions) {
        createVariableRevision({
          modelId,
          revisionId,
          variableData: e,
        });
      }
    });
    console.log(
      `Build created for model revision ID: ${modelRevision.id}, in ${endTime - startTime}ms. Created ${response.variableRevisions.length} variableRevisions.`
    );
  } catch (error) {
    console.error("Error building model revision:", error);
    throw error;
  }
}

async function countItemsRemaining() {
  const remaining = await prisma.modelRevision.count({
    where: {
      builds: {
        none: {},
      },
      contentType: "SquiggleSnippet",
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
      await delay(500); // Delay for 0.5s
    } catch (error) {
      console.error("An error occurred during continuous execution:", error);
    }
  }
}

runContinuously();
