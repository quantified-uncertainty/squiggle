import fs from "fs";
import path from "path";

/**
 * This script recalculates the scores and ranks for each submission.
 *
 * It became necessary because the initial per-category scores were wrong - evaluator code didn't parse the Claude outputs correctly.
 *
 * So I:
 * 1) updated the scores in `evaluation-results.json` by hand
 * 2) generated this script with Claude Code to reorder JSON entries and recalculate the total scores
 * 3) generated `./generate-report.ts` with Claude Code to generate the markdown report
 *
 * There's some duplicate code and sloppy code in these scripts, but they seem to be correct and we probably won't need to touch them for a while.
 */

// Load the evaluation results
const resultsPath = path.join(process.cwd(), "data", "evaluation-results.json");
const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

// Calculate total score and final score for each submission
// Weights for each criterion
const weights = {
  SURPRISE: 0.4,
  RELEVANCE: 0.2,
  ROBUSTNESS: 0.2,
  QUALITY: 0.2,
};

// Calculate the total score for each submission
results.forEach((submission: any) => {
  // Calculate weighted average score
  let totalScore = 0;
  for (const [criterion, weight] of Object.entries(weights)) {
    totalScore += submission.scores[criterion].score * weight;
  }

  submission.totalScore = totalScore;

  // Apply goodharting penalty (which is 0 in this dataset)
  submission.goodhartingPenalty = 0;

  // Calculate final score
  submission.finalScore = totalScore * (1 - submission.goodhartingPenalty);
});

// Sort submissions by final score in descending order
results.sort((a: any, b: any) => b.finalScore - a.finalScore);

// Update ranks based on the sorted order
results.forEach((submission: any, index: number) => {
  submission.rank = index + 1;
});

// Write the updated results back to the file
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

console.log(
  "Successfully updated evaluation-results.json with new scores and ranks."
);
