import { config } from "dotenv";
import fs from "fs";
import * as csv from "fast-csv";
import enquirer from "enquirer";
import { LLMClient, type Message } from "@quri/squiggle-ai";

config();

// Quality dimensions we evaluate on
const QUALITY_DIMENSIONS = [
  "accuracy",
  "documentation",
  "cleverness",
  "comprehensiveness",
] as const;

type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

// Weights for final score calculation
const DIMENSION_WEIGHTS: Record<QualityDimension, number> = {
  accuracy: 0.4,
  documentation: 0.25,
  comprehensiveness: 0.2,
  cleverness: 0.15,
};

type QualityScore = {
  score: number; // 1-10
  explanation: string;
};

type QualityScores = {
  [K in QualityDimension]: QualityScore;
};

// Extended EvalResult with quality scores
type EvalResult = {
  runId: string;
  prompt: string;
  modelName: string;
  dateRan: string;
  succeeded: boolean;
  cost?: number;
  timeOfCompletionMs?: number;
  llmRunCount?: number;
  linesOfCode?: number;
  finalCode?: string;
  logSummary?: string;
  error?: string;
};

type EvalResultWithQuality = EvalResult & {
  qualityScores: QualityScores;
  finalQualityScore: number;
};

type EvaluationParameters = {
  inputFile: string;
  qualityEvalRuns: number;
};

async function getEvaluationParameters(): Promise<EvaluationParameters> {
  // Find all eval-results JSON files in the current directory
  const files = fs
    .readdirSync(".")
    .filter((f) => f.startsWith("eval-results-") && f.endsWith(".json"))
    .sort()
    .reverse(); // Most recent first

  if (files.length === 0) {
    throw new Error(
      "No eval-results-*.json files found in current directory. Please run simple-evals first."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { prompt } = enquirer as any;
  const answers: EvaluationParameters = await prompt([
    {
      type: "select",
      name: "inputFile",
      message: "Select eval results file to evaluate",
      choices: files,
    },
    {
      type: "numeral",
      name: "qualityEvalRuns",
      message: "How many quality evaluation runs per result?",
      initial: 1,
    },
  ]);

  return answers;
}

async function evaluateSingleDimension(
  dimension: QualityDimension,
  result: EvalResult,
  llmClient: LLMClient
): Promise<number> {
  const dimensionPrompts: Record<QualityDimension, string> = {
    accuracy:
      "Rate how accurate and correct the Squiggle code is for the given prompt. Does it model the problem appropriately? Are the assumptions reasonable? Would the results be useful?",
    documentation:
      "Rate the quality of documentation in the code. Are variables well-named? Are there helpful comments? Is the code structure clear and understandable?",
    cleverness:
      "Rate how clever and sophisticated the approach is. Does it use advanced Squiggle features appropriately? Is the solution elegant?",
    comprehensiveness:
      "Rate how comprehensive and complete the solution is. Does it cover important aspects of the problem? Are edge cases considered? Is the model thorough?",
  };

  const systemPrompt = `You are an expert evaluator of Squiggle code. Squiggle is a probabilistic programming language.

Your task is to evaluate the quality of generated Squiggle code on a specific dimension.

${dimensionPrompts[dimension]}

Respond with ONLY a single number from 1 to 10, where:
- 1-3: Poor quality
- 4-6: Moderate quality
- 7-8: Good quality
- 9-10: Excellent quality

Do not include any explanation or additional text, just the number.`;

  const userPrompt = `Original Prompt: "${result.prompt}"

Succeeded: ${result.succeeded}

Generated Code:
\`\`\`squiggle
${result.finalCode || "(no code generated)"}
\`\`\`

${result.error ? `Error: ${result.error}` : ""}

Rate this code on the ${dimension} dimension (1-10):`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await llmClient.run(messages);

  const content = response.content;
  const score = parseFloat(content.trim());
  if (isNaN(score) || score < 1 || score > 10) {
    console.warn(
      `Invalid score "${content}" for ${dimension}, defaulting to 5`
    );
    return 5;
  }

  return score;
}

async function evaluateQuality(
  result: EvalResult,
  runs: number
): Promise<{ qualityScores: QualityScores; finalQualityScore: number }> {
  const llmClient = new LLMClient(
    "Claude-4-5-Sonnet",
    undefined,
    process.env["ANTHROPIC_API_KEY"]
  );

  const dimensionScores: Record<QualityDimension, number[]> = {
    accuracy: [],
    documentation: [],
    cleverness: [],
    comprehensiveness: [],
  };

  // Run evaluations
  for (let run = 0; run < runs; run++) {
    console.log(`  Quality eval run ${run + 1}/${runs}`);
    for (const dimension of QUALITY_DIMENSIONS) {
      const score = await evaluateSingleDimension(dimension, result, llmClient);
      dimensionScores[dimension].push(score);
    }
  }

  // Calculate averages and create QualityScores
  const qualityScores = {} as QualityScores;
  for (const dimension of QUALITY_DIMENSIONS) {
    const scores = dimensionScores[dimension];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    qualityScores[dimension] = {
      score: avgScore,
      explanation: `Average of ${runs} evaluation(s): ${scores.join(", ")}`,
    };
  }

  // Calculate weighted final score
  const finalQualityScore = QUALITY_DIMENSIONS.reduce(
    (total, dimension) =>
      total + qualityScores[dimension].score * DIMENSION_WEIGHTS[dimension],
    0
  );

  return { qualityScores, finalQualityScore };
}

function saveQualityResults(results: EvalResultWithQuality[]): Promise<void> {
  const baseName = `eval-results-quality-${new Date().toISOString().replace(/:/g, "-")}`;

  // Save JSON with full quality data
  const jsonFilename = `${baseName}.json`;
  fs.writeFileSync(jsonFilename, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${jsonFilename}`);

  // Save CSV
  return new Promise((resolve, reject) => {
    const csvFilename = `${baseName}.csv`;
    const csvStream = csv.format({ headers: true });
    const writableStream = fs.createWriteStream(csvFilename);

    writableStream.on("finish", () => {
      console.log(`Results saved to ${csvFilename}`);
      resolve();
    });
    writableStream.on("error", reject);

    csvStream.pipe(writableStream);

    results.forEach((result) => {
      csvStream.write({
        runId: result.runId,
        prompt: result.prompt,
        modelName: result.modelName,
        dateRan: result.dateRan,
        succeeded: result.succeeded,
        cost: result.cost,
        timeOfCompletionMs: result.timeOfCompletionMs,
        llmRunCount: result.llmRunCount,
        linesOfCode: result.linesOfCode,
        error: result.error,
        // Quality scores
        accuracyScore: result.qualityScores.accuracy.score,
        documentationScore: result.qualityScores.documentation.score,
        clevernessScore: result.qualityScores.cleverness.score,
        comprehensivenessScore: result.qualityScores.comprehensiveness.score,
        finalQualityScore: result.finalQualityScore,
      });
    });

    csvStream.end();
  });
}

async function main() {
  // Validate required environment variables
  if (!process.env["ANTHROPIC_API_KEY"]) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required. Please add it to your .env file."
    );
  }

  const { inputFile, qualityEvalRuns } = await getEvaluationParameters();

  if (qualityEvalRuns <= 0) {
    console.log("Invalid number of quality evaluation runs. Exiting.");
    return;
  }

  // Load the eval results
  const resultsData = fs.readFileSync(inputFile, "utf-8");
  const results: EvalResult[] = JSON.parse(resultsData);

  console.log(
    `\nLoaded ${results.length} results from ${inputFile}. Starting quality evaluation...\n`
  );

  const qualityResults: EvalResultWithQuality[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    console.log(
      `[${i + 1}/${results.length}] Evaluating ${result.runId}: "${result.prompt.slice(0, 50)}..."`
    );

    const { qualityScores, finalQualityScore } = await evaluateQuality(
      result,
      qualityEvalRuns
    );

    qualityResults.push({
      ...result,
      qualityScores,
      finalQualityScore,
    });

    console.log(`  Final quality score: ${finalQualityScore.toFixed(2)}/10\n`);
  }

  await saveQualityResults(qualityResults);
  console.log("\nQuality evaluation complete!");
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
