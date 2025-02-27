/**
 * Fermi Model Competition Evaluator
 * Based on: https://forum.effectivealtruism.org/posts/Zc5jki9nXihueDcKj/usd300-fermi-model-competition
 */

import fs from "fs";
import path from "path";

import { FermiContestEvaluator, Submission } from "./evaluator";
import { config } from "./config";

// Types for the submissions file structure
interface SubmissionFileEntry {
  id: string;
  author: string;
  model: string;
  summary: string;
  technique: string;
  timestamp?: string;
}

// Main function to run evaluations on submissions
async function runEvaluation() {
  try {
    // Read submissions from JSON file
    const submissionsPath = path.join(__dirname, "../data/submissions.json");

    if (!fs.existsSync(submissionsPath)) {
      console.error("Error: submissions.json file not found");
      await createExampleFile();
      console.log(
        "Please edit the example file with actual submissions and run again"
      );
      return;
    }

    const submissionsData = await fs.promises.readFile(
      submissionsPath,
      "utf-8"
    );
    const submissionsFile: SubmissionFileEntry[] = JSON.parse(submissionsData);

    console.log(`Loaded ${submissionsFile.length} submissions from file`);

    // Map file entries to Submission objects for evaluation
    const submissions: Submission[] = submissionsFile.map((entry) => ({
      id: entry.id,
      author: entry.author,
      model: entry.model,
      summary: entry.summary,
      technique: entry.technique,
    }));

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
      console.warn("\nWarning: No API key found for LLM evaluation");
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

    // Show summary
    console.log("Summary:");
    console.log(
      `  ${submission.summary.substring(0, 200)}${submission.summary.length > 200 ? "..." : ""}`
    );

    // Show technique
    console.log("Technique:");
    console.log(`  ${submission.technique}`);

    // Show model preview
    console.log("Model (preview):");
    console.log(
      `  ${submission.model.substring(0, 200)}${submission.model.length > 200 ? "..." : ""}`
    );
  });

  console.log(
    "\nTo evaluate these submissions, add API keys to .env file and run again"
  );
}

// Create an example submissions file if one doesn't exist
async function createExampleFile() {
  const dataDir = path.join(__dirname, "../data");
  const submissionsPath = path.join(dataDir, "submissions.json");
  const penaltiesPath = path.join(dataDir, "penalties.json");
  const envPath = path.join(__dirname, "../.env");

  try {
    // Check if data directory exists, create if not
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
      console.log("Created data directory");
    }

    // Create example submissions file if it doesn't exist
    if (!fs.existsSync(submissionsPath)) {
      const exampleSubmissions = [
        {
          id: "submission1",
          author: "Example Author",
          model:
            "# Expected AI Impact on Economic Growth\n\nI'll estimate the impact of AI on global economic growth over the next decade using a framework that considers both accelerating and decelerating factors.\n\n## Key Parameters\n\n1. Current annual global GDP growth rate: ~3%\n2. Percentage of economic tasks automatable by AI: 40-60%\n3. Adoption rate of AI technologies: 5-15% annually\n4. Productivity gains from AI adoption: 10-30%\n5. Implementation friction and transition costs: 30-50% efficiency loss\n6. Regulatory and safety slowdowns: 1-3 years of delay\n\n## Calculation\n\n- Base economic growth without AI: 3% annually\n- Automatable economic activity: 50% of GDP\n- Average annual AI adoption rate: 10%\n- Average productivity improvement: 20%\n- Transition efficiency loss: 40%\n\nThis gives us:\nAnnual AI-driven growth increment = Automatable GDP (50%) × Adoption rate (10%) × Productivity gain (20%) × Implementation efficiency (60%) = 0.6% additional GDP growth\n\nSo total expected GDP growth = 3% + 0.6% = 3.6% annually\n\nFactoring in regulatory delays and accounting for compounding effects, I estimate AI will add 0.4-0.8% to annual global economic growth by 2035, resulting in a world economy that's approximately 8-12% larger than it would be without AI advancements.\n\nThe surprising finding is that despite revolutionary potential, realistic deployment constraints mean AI's impact on economic growth in the next decade will be positive but modest - nowhere near the transformative rates some have predicted.",
          summary:
            "This model estimates AI's impact on global economic growth, finding that despite revolutionary potential, realistic deployment constraints will result in only a modest 0.4-0.8% boost to annual global GDP growth by 2035. This challenges techno-optimist narratives predicting radical economic transformation.",
          technique:
            "Used Claude 3.5 Sonnet with a structured parameter estimation approach, breaking down the problem into key variables and constraints.",
        },
        {
          id: "submission2",
          author: "Another Example",
          model:
            "# Fermi Estimate: Percentage of EA Community Members Who Will Experience Burnout in 2025\n\n## Parameters\n\n1. Total active EA community members: 5,000-15,000 people\n2. Annual baseline burnout rate in mission-driven communities: 15-30%\n3. Intensity modifier for EA work culture: 1.2-1.5x baseline\n4. Preventative measures modifier: 0.7-0.9x (accounting for awareness and resources)\n5. Uncertainty in AI progress causing stress: 1.1-1.3x\n6. Economic pressure on funding: 1.1-1.2x\n\n## Calculation\n\n- Median EA community size: 10,000 active members\n- Baseline burnout rate: 20% annually\n- EA intensity adjustment: 1.3x baseline\n- Preventative measures: 0.8x reduction\n- Special factors for 2025:\n  - AI uncertainty: 1.2x increase\n  - Funding pressure: 1.15x increase\n\nFinal calculation:\n10,000 people × 20% baseline × 1.3 intensity × 0.8 prevention × 1.2 AI factor × 1.15 funding pressure = ~2,860 people\n\nTherefore, approximately 2,900 EA community members (29% of the community) will experience significant burnout in 2025.\n\nThis is notably higher than many community organizers expect (most assume 15-20%), suggesting current prevention measures are insufficient given the unique stressors of the coming year.",
          summary:
            "This model estimates EA community burnout rates for 2025, predicting ~29% of community members will experience burnout - significantly higher than the 15-20% commonly expected by community organizers. It identifies AI uncertainty and funding pressure as key exacerbating factors that aren't adequately addressed by current prevention efforts.",
          technique:
            "Used GPT-4 to explore multiple modeling approaches, then settled on a multiplicative factor model with distinct parameters for community-specific stressors.",
        },
      ];

      await fs.promises.writeFile(
        submissionsPath,
        JSON.stringify(exampleSubmissions, null, 2)
      );
      console.log(`Created example submissions file at ${submissionsPath}`);
    }

    // Create example penalties file if it doesn't exist
    if (!fs.existsSync(penaltiesPath)) {
      const examplePenalties = {
        submission1: 0, // No penalty
        submission2: 0.1, // 10% penalty
      };

      await fs.promises.writeFile(
        penaltiesPath,
        JSON.stringify(examplePenalties, null, 2)
      );
      console.log(`Created example penalties file at ${penaltiesPath}`);
    }

    // Create example .env file if it doesn't exist
    if (!fs.existsSync(envPath)) {
      const envContent = `# API Keys for LLM evaluation
# Uncomment and add your key to use

# Anthropic API Key (preferred for Claude evaluation)
# ANTHROPIC_API_KEY=your_key_here

# Configuration
LLM_MODEL=claude-3-5-sonnet-20240620
RUNS_PER_SUBMISSION=3
`;

      await fs.promises.writeFile(envPath, envContent);
      console.log(`Created example .env file at ${envPath}`);
    }
  } catch (error) {
    console.error("Error creating example files:", error);
  }
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
