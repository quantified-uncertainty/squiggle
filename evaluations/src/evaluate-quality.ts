import { config } from "dotenv";
import fs from "fs";
import * as csv from "fast-csv";
import enquirer from "enquirer";
import { LLMClient, type Message } from "@quri/squiggle-ai";
import pLimit from "p-limit";

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
  concurrencyLimit: number;
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
    {
      type: "numeral",
      name: "concurrencyLimit",
      message: "Concurrency limit (how many evaluations to run in parallel)?",
      initial: 3,
    },
  ]);

  return answers;
}

async function evaluateSingleDimension(
  dimension: QualityDimension,
  result: EvalResult,
  llmClient: LLMClient
): Promise<{ score: number; explanation: string }> {
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

Score scale:
- 1-3: Poor quality
- 4-6: Moderate quality
- 7-8: Good quality
- 9-10: Excellent quality

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON. You may use markdown code blocks. Do not include explanatory text outside the JSON.

Response format (use these exact field names):
{"score": 7, "explanation": "Brief explanation here"}

The "score" field must be a number from 1-10.
The "explanation" field should be a brief explanation of your rating.

Example valid response:
{"score": 6, "explanation": "The code shows moderate accuracy with reasonable assumptions but lacks consideration of seasonal variations"}`;

  const userPrompt = `Original Prompt: "${result.prompt}"

Succeeded: ${result.succeeded}

Generated Code:
\`\`\`squiggle
${result.finalCode || "(no code generated)"}
\`\`\`

${result.error ? `Error: ${result.error}` : ""}

Rate this code on the ${dimension} dimension. Respond with JSON only:`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await llmClient.run(messages);

  try {
    let content = response.content.trim();

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    // Try to extract JSON object if there's extra text
    const objectMatch = content.match(/\{[\s\S]*?\}/);
    if (objectMatch && !content.startsWith('{')) {
      content = objectMatch[0];
    }

    const parsed = JSON.parse(content);
    // Handle various field name variations the LLM might use
    const score = parseFloat(parsed.score || parsed.rating);
    const explanation = parsed.explanation || parsed.rationale || parsed.reasoning || parsed.reason || "No explanation provided";

    if (isNaN(score) || score < 1 || score > 10) {
      console.warn(
        `Invalid score ${score} for ${dimension}, defaulting to 5`
      );
      return { score: 5, explanation: "Invalid score, defaulted to 5" };
    }

    return { score, explanation };
  } catch (error) {
    console.warn(
      `Failed to parse JSON response for ${dimension}: ${response.content.substring(0, 100)}...`
    );
    console.warn(`Defaulting to 5`);
    return { score: 5, explanation: "Failed to parse response" };
  }
}

async function evaluateQuality(
  result: EvalResult,
  runs: number,
  runId: string
): Promise<{ qualityScores: QualityScores; finalQualityScore: number }> {
  const llmClient = new LLMClient(
    "Claude-4-5-Sonnet",
    undefined,
    process.env["ANTHROPIC_API_KEY"]
  );

  const dimensionResults: Record<
    QualityDimension,
    Array<{ score: number; explanation: string }>
  > = {
    accuracy: [],
    documentation: [],
    cleverness: [],
    comprehensiveness: [],
  };

  // Run evaluations
  for (let run = 0; run < runs; run++) {
    console.log(`(${runId})   Quality eval run ${run + 1}/${runs}`);
    for (const dimension of QUALITY_DIMENSIONS) {
      const evalResult = await evaluateSingleDimension(dimension, result, llmClient);
      dimensionResults[dimension].push(evalResult);
    }
  }

  // Calculate averages and create QualityScores
  const qualityScores = {} as QualityScores;
  for (const dimension of QUALITY_DIMENSIONS) {
    const results = dimensionResults[dimension];
    const scores = results.map((r) => r.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Combine explanations from all runs
    const explanations = results.map((r, i) => `Run ${i + 1}: ${r.explanation}`).join("; ");

    qualityScores[dimension] = {
      score: avgScore,
      explanation: runs > 1
        ? `Average: ${avgScore.toFixed(1)}/10. ${explanations}`
        : results[0].explanation,
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
        // Quality scores (rounded to 2 decimal places)
        accuracyScore: result.qualityScores.accuracy.score.toFixed(2),
        documentationScore: result.qualityScores.documentation.score.toFixed(2),
        clevernessScore: result.qualityScores.cleverness.score.toFixed(2),
        comprehensivenessScore: result.qualityScores.comprehensiveness.score.toFixed(2),
        finalQualityScore: result.finalQualityScore.toFixed(2),
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

  const { inputFile, qualityEvalRuns, concurrencyLimit } =
    await getEvaluationParameters();

  if (qualityEvalRuns <= 0) {
    console.log("Invalid number of quality evaluation runs. Exiting.");
    return;
  }

  // Load the eval results
  const resultsData = fs.readFileSync(inputFile, "utf-8");
  const results: EvalResult[] = JSON.parse(resultsData);

  console.log(
    `\nLoaded ${results.length} results from ${inputFile}. Starting quality evaluation with concurrency limit of ${concurrencyLimit}...\n`
  );

  // Run quality evaluations in parallel with concurrency limit
  const limit = pLimit(concurrencyLimit);

  const qualityResults = await Promise.all(
    results.map((result, i) =>
      limit(async () => {
        console.log(
          `(${result.runId}) [${i + 1}/${results.length}] Evaluating: "${result.prompt.slice(0, 50)}..."`
        );

        const { qualityScores, finalQualityScore } = await evaluateQuality(
          result,
          qualityEvalRuns,
          result.runId
        );

        console.log(
          `(${result.runId})   Final quality score: ${finalQualityScore.toFixed(2)}/10`
        );

        return {
          ...result,
          qualityScores,
          finalQualityScore,
        };
      })
    )
  );

  await saveQualityResults(qualityResults);
  console.log("\nQuality evaluation complete!");
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
