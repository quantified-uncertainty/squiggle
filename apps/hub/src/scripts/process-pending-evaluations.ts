#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";

/**
 * This script processes all pending evaluations.
 * It can be run as a cron job or via some other scheduler.
 *
 * Usage: pnpm tsx --conditions=react-server src/scripts/process-pending-evaluations.ts
 */
import { processEvaluation } from "@/evals/lib/processEvaluation";
import { prisma } from "@/lib/server/prisma";
import { sleep } from "@/lib/sleep";

async function act(options: { restartFailed?: boolean }) {
  // Find all pending evaluations
  const pendingEvals = await prisma.evaluation.findMany({
    where: {
      state: {
        in: ["Pending", ...(options.restartFailed ? ["Failed" as const] : [])],
      },
    },
    include: {
      agent: true,
      questionSet: {
        include: {
          questions: {
            include: {
              question: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${pendingEvals.length} pending evaluations to process.`);

  for (const evaluation of pendingEvals) {
    await processEvaluation(evaluation);
  }
}

async function main() {
  const program = new Command().option("-l, --loop").option("--restart-failed");
  program.parse();
  const { loop, ...options } = program.opts();

  console.log("Starting processing of pending evaluations...");

  if (loop) {
    while (true) {
      await act(options);
      await sleep(1000);
    }
  } else {
    await act(options);
  }

  console.log("Finished processing pending evaluations.");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
