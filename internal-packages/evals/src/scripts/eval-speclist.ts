import "dotenv/config";

import inquirer from "inquirer";

import { getAiEvaluator } from "../evals/aiEvaluator.js";
import { printEvalResultList, runEvalOnSpecList } from "../evals/index.js";
import { getAllSpecLists, getSpecListById } from "../specLists.js";

async function selectSpecList() {
  // If specListId is provided as command line argument, use it
  const specListId = process.argv[2];
  if (specListId) {
    return await getSpecListById(specListId);
  }

  // Otherwise, show a selection menu
  const specLists = await getAllSpecLists();

  if (specLists.length === 0) {
    throw new Error(
      "No spec lists found in the database. Please create one first using add-speclist.ts"
    );
  }

  // Ask user to select a spec list
  const { selectedSpecListId } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedSpecListId",
      message: "Select a spec list to evaluate:",
      choices: specLists.map((list) => ({
        name: `${list.id} (${list.specs.length} specs)`,
        value: list.id,
      })),
    },
  ]);

  return await getSpecListById(selectedSpecListId);
}

async function main() {
  try {
    const specList = await selectSpecList();

    console.log(`Running evaluation on spec list: ${specList.id}`);
    console.log(`Number of specs: ${specList.specs.length}`);

    // Get evaluator
    const evaluator = await getAiEvaluator({
      storeInDb: true,
    });

    // Run evaluation
    const evaluation = await runEvalOnSpecList(specList, evaluator);

    console.log(`Evaluation saved with ID: ${evaluation.id}`);

    // Print results
    await printEvalResultList(evaluation);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
