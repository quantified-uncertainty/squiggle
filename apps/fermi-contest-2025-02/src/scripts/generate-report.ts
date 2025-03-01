import fs from "fs";
import path from "path";

// Load the evaluation results
const resultsPath = path.join(process.cwd(), "data", "evaluation-results.json");
const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

// Generate the report markdown
function generateReport() {
  let report = "# Fermi Model Competition Evaluation Results\n\n";

  // Overall Rankings table
  report += "## Overall Rankings\n\n";
  report +=
    "| Rank | Author | Final Score | Surprise | Topic Relevance | Robustness | Model Quality | Penalty |\n";
  report +=
    "|------|--------|-------------|----------|-----------------|------------|--------------|--------|\n";

  results.forEach((submission: any) => {
    report += `| ${submission.rank} | ${submission.author} | ${submission.finalScore.toFixed(2)} | `;
    report += `${submission.scores.SURPRISE.score.toFixed(1)} | `;
    report += `${submission.scores.RELEVANCE.score.toFixed(1)} | `;
    report += `${submission.scores.ROBUSTNESS.score.toFixed(1)} | `;
    report += `${submission.scores.QUALITY.score.toFixed(1)} | `;
    report += `${(submission.goodhartingPenalty * 100).toFixed(0)}% |\n`;
  });

  report += "\n## Detailed Evaluation Results\n\n";

  // Add detailed evaluations for each submission
  results.forEach((submission: any) => {
    report += `### ${submission.rank}. ${submission.author} (${submission.submissionId})\n\n`;
    report += `**Final Score**: ${submission.finalScore.toFixed(2)}/10\n\n`;

    // Surprise
    report += `#### Surprise (40%): ${submission.scores.SURPRISE.score.toFixed(2)}/10\n\n`;
    report += submission.scores.SURPRISE.explanation + "\n\n";

    // Topic Relevance
    report += `#### Topic Relevance (20%): ${submission.scores.RELEVANCE.score.toFixed(2)}/10\n\n`;
    report += submission.scores.RELEVANCE.explanation + "\n\n";

    // Robustness
    report += `#### Robustness (20%): ${submission.scores.ROBUSTNESS.score.toFixed(2)}/10\n\n`;
    report += submission.scores.ROBUSTNESS.explanation + "\n\n";

    // Model Quality
    report += `#### Model Quality (20%): ${submission.scores.QUALITY.score.toFixed(2)}/10\n\n`;
    report += submission.scores.QUALITY.explanation + "\n\n";
  });

  return report;
}

// Write the report to a file
const reportPath = path.join(process.cwd(), "data", "evaluation-report.md");
fs.writeFileSync(reportPath, generateReport());

console.log("Successfully generated evaluation-report.md.");
