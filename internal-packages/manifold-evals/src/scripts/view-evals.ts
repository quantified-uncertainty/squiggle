#!/usr/bin/env tsx

import "dotenv/config";
import inquirer from "inquirer";
import { prisma } from "../specLists.js";

async function selectEval() {
  // Get all evals with their spec lists
  const evals = await prisma.eval.findMany({
    include: {
      specList: true,
      _count: {
        select: { evalResults: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (evals.length === 0) {
    throw new Error("No evaluations found in the database");
  }

  // Ask user to select an eval
  const { evalId } = await inquirer.prompt([
    {
      type: "list",
      name: "evalId",
      message: "Select an evaluation to view:",
      choices: evals.map((eval_) => ({
        name: `${eval_.id} (${eval_.evaluator}, ${eval_._count.evalResults} results, created ${eval_.createdAt.toLocaleString()})`,
        value: eval_.id,
      })),
    },
  ]);

  return evalId;
}

async function displayEvalResults(evalId: string) {
  // Get eval results with related specs
  const eval_ = await prisma.eval.findUniqueOrThrow({
    where: { id: evalId },
    include: {
      specList: true,
      evalResults: {
        include: {
          spec: true,
          workflow: true,
        },
      },
    },
  });

  console.log("\n========================================");
  console.log(`Evaluation ID: ${eval_.id}`);
  console.log(`Created: ${eval_.createdAt.toLocaleString()}`);
  console.log(`Evaluator: ${eval_.evaluator}`);
  console.log(`SpecList ID: ${eval_.specList.id}`);
  console.log(`Results: ${eval_.evalResults.length}`);
  console.log("========================================\n");

  // Display each result
  for (const result of eval_.evalResults) {
    console.log(`\nSpec: ${result.spec.description}`);
    console.log(`ID: ${result.spec.id}`);
    
    if (result.workflow) {
      console.log(`Workflow ID: ${result.workflow.id}`);
    }
    
    console.log("\nCode:");
    console.log(result.code);
    console.log("\n----------------------------------------");
  }
}

async function main() {
  try {
    const evalId = await selectEval();
    await displayEvalResults(evalId);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();