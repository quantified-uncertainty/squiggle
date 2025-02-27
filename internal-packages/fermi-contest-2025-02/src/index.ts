/**
 * Fermi Model Competition Evaluator
 * Based on: https://forum.effectivealtruism.org/posts/Zc5jki9nXihueDcKj/usd300-fermi-model-competition
 */

import fs from "fs";
import path from "path";

import { config } from "./config";
import { FermiContestEvaluator } from "./evaluator";
import { Submission } from "./types";

// Main function to run evaluations on submissions
async function runEvaluation() {
  try {
    // Read submissions from JSON file
    const submissionsPath = path.join(__dirname, "../data/submissions.json");

    if (!fs.existsSync(submissionsPath)) {
      console.error(
        "Error: submissions.json file not found, fill it with `pnpm run collect` first"
      );
      return;
    }

    const submissionsData = await fs.promises.readFile(
      submissionsPath,
      "utf-8"
    );
    const submissions: Submission[] = JSON.parse(submissionsData);

    console.log(`Loaded ${submissions.length} submissions from file`);

    // Read goodharting penalties if present
    const penaltiesPath = path.join(__dirname, "../data/penalties.json");
    let goodhartingPenalties: Record<string, number> = {};

    if (fs.existsSync(penaltiesPath)) {
      const penaltiesData = await fs.promises.readFile(penaltiesPath, "utf-8");
      goodhartingPenalties = JSON.parse(penaltiesData);
      console.log("Loaded goodharting penalties");
    }

    // Check if we have API key for LLM evaluation
    if (!config.ANTHROPIC_API_KEY) {
      console.warn("\nError: No API key found for LLM evaluation");
      console.warn("Set ANTHROPIC_API_KEY in .env file");
      displaySubmissions(submissions);
      return;
    }

    // Initialize the evaluator
    const evaluator = new FermiContestEvaluator({
      anthropicApiKey: config.ANTHROPIC_API_KEY,
      llmModel: config.LLM_MODEL,
      runsPerSubmission: config.RUNS_PER_SUBMISSION,
    });

    console.log("\nEvaluating submissions...");
    const evaluationResults = await evaluator.evaluateSubmissions(
      submissions,
      goodhartingPenalties
    );

    // Generate and save report
    const report = evaluator.generateReport(evaluationResults);
    const reportPath = path.join(__dirname, "../data/evaluation-report.md");
    await fs.promises.writeFile(reportPath, report);
    console.log(`\nEvaluation report saved to ${reportPath}`);

    // Also save raw evaluation results
    const resultsPath = path.join(__dirname, "../data/evaluation-results.json");
    await fs.promises.writeFile(
      resultsPath,
      JSON.stringify(evaluationResults, null, 2)
    );
    console.log(`Raw evaluation results saved to ${resultsPath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error processing submissions:", error.message);
      console.error(error.stack);
    } else {
      console.error("Unknown error:", error);
    }
  }
}

// Display submissions from the file (used when LLM evaluation is not available)
function displaySubmissions(submissions: Submission[]) {
  console.log("\nSubmissions:");
  submissions.forEach((submission, index) => {
    console.log(`\n${index + 1}. ${submission.author} (${submission.id})`);

    // Show model preview
    console.log("Model (preview):");
    console.log(
      `  ${submission.text.substring(0, 200)}${submission.text.length > 200 ? "..." : ""}`
    );
  });

  console.log(
    "\nTo evaluate these submissions, add API keys to .env file and run again"
  );
}

// Run the program
async function main() {
  console.log("Fermi Model Competition Evaluator");
  await runEvaluation();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
