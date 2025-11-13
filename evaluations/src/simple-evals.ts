import { config } from "dotenv";
import fs from "fs";
import { randomBytes } from "crypto";
import * as csv from "fast-csv";
import enquirer from "enquirer";
import pLimit from "p-limit";

import {
  PromptArtifact,
  createSquiggleWorkflowTemplate,
} from "@quri/squiggle-ai/server";
import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";

config();

const prompts = [
  "Simple financial projections for a new bubble tea shop in Berkeley CA",
  "Estimate total money saved by autonomous vehicles",
  "Piano tuners in Chicago",
  "Total length of blood vessels in human body",
  "Annual revenue of all McDonald’s locations worldwide",
];

type EvalResult = {
  runId: string;
  prompt: string;
  modelName: LlmId;
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

type EvalParameters = {
  llmIds: LlmId[];
  selectedPrompts: string[];
  runsPerCombination: number;
  concurrencyLimit: number;
};

function getLlmConfig(llmId: LlmId) {
  return {
    llmId,
    priceLimit: 2,
    durationLimitMinutes: llmId.toLowerCase().includes("gemini-2-5-pro")
      ? 4
      : 2,
    messagesInHistoryToKeep: 4,
    numericSteps: 3,
    styleGuideSteps: 2,
  };
}

function getParams(prompt: string, llmId: LlmId) {
  const llmConfig = getLlmConfig(llmId);
  const prompArtifact = new PromptArtifact(prompt);

  return {
    inputs: { prompt: prompArtifact },
    openaiApiKey: process.env["OPENAI_API_KEY"],
    anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    openRouterApiKey: process.env["OPENROUTER_API_KEY"],
    llmConfig,
  };
}

async function createWorkflow(prompt: string, llmId: LlmId) {
  const params = getParams(prompt, llmId);
  return createSquiggleWorkflowTemplate.instantiate(params);
}

type WorkflowResult = {
  code: string;
  isValid: boolean;
  error?: string;
  totalPrice: number;
  runTimeMs: number;
  llmRunCount: number;
  logSummary: string;
};

function toEvalResult(
  {
    totalPrice,
    runTimeMs,
    llmRunCount,
    code,
    isValid,
    logSummary,
  }: WorkflowResult,
  prompt: string,
  llmId: LlmId,
  runId: string
): EvalResult {
  const linesOfCode = code.split("\n").length;

  return {
    runId,
    prompt,
    modelName: llmId,
    dateRan: new Date().toISOString(),
    succeeded: isValid,
    cost: totalPrice,
    timeOfCompletionMs: runTimeMs,
    llmRunCount,
    linesOfCode,
    finalCode: code,
    logSummary,
  };
}

function toErrorResult(
  prompt: string,
  llmId: LlmId,
  error: unknown,
  runId: string
): EvalResult {
  return {
    runId,
    prompt,
    modelName: llmId,
    dateRan: new Date().toISOString(),
    succeeded: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

function generateRunId(): string {
  return randomBytes(3).toString("hex").slice(0, 5);
}

async function runSingleEval(
  prompt: string,
  llmId: LlmId,
  runNumber: number,
  totalRuns: number
): Promise<EvalResult> {
  const runId = generateRunId();
  console.log(
    `(${runId}) Running prompt: "${prompt}" with LLM: ${llmId}, run ${runNumber}/${totalRuns}`
  );

  try {
    const workflow = await createWorkflow(prompt, llmId);
    const workflowResult = await workflow.runToResult();
    const result = toEvalResult(workflowResult, prompt, llmId, runId);

    console.log(
      `(${runId}) Finished run. Success: ${result.succeeded}, Cost: ${result.cost}`
    );

    return result;
  } catch (error) {
    console.error(
      `(${runId}) Error running prompt: "${prompt}" with LLM: ${llmId}, run ${runNumber}`,
      error
    );

    const result = toErrorResult(prompt, llmId, error, runId);

    return result;
  }
}

function saveResults(results: EvalResult[]): Promise<void> {
  const baseName = `eval-results-${new Date().toISOString().replace(/:/g, "-")}`;

  const jsonFilename = `${baseName}.json`;
  fs.writeFileSync(jsonFilename, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${jsonFilename}`);

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
      });
    });

    csvStream.end();
  });
}

async function getEvalParameters(): Promise<EvalParameters> {
  const allModelIds = MODEL_CONFIGS.filter((c) => c.provider !== "openai").map(
    (c) => c.id
  );

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { prompt } = enquirer as any;
  const answers: EvalParameters & { customPrompt?: string } = await prompt([
    {
      type: "multiselect",
      name: "llmIds",
      message: "Select models to run",
      choices: allModelIds,
      initial: ["Claude-4-5-Sonnet"],
    },
    {
      type: "multiselect",
      name: "selectedPrompts",
      message: "Select prompts to run",
      choices: prompts,
      initial: [prompts[0]],
    },
    {
      type: "input",
      name: "customPrompt",
      message: "Additionally, enter a custom prompt (or leave blank to skip)",
    },
    {
      type: "numeral",
      name: "runsPerCombination",
      message: "How many runs per combination?",
      initial: 1,
    },
    {
      type: "numeral",
      name: "concurrencyLimit",
      message: "Concurrency limit (how many evaluations to run in parallel)?",
      initial: 5,
    },
  ]);

  if (answers.customPrompt) {
    answers.selectedPrompts.push(answers.customPrompt);
  }

  return {
    llmIds: answers.llmIds,
    selectedPrompts: answers.selectedPrompts,
    runsPerCombination: answers.runsPerCombination,
    concurrencyLimit: answers.concurrencyLimit,
  };
}

async function main() {
  // Validate required environment variables
  if (!process.env["ANTHROPIC_API_KEY"]) {
    console.error(
      "Error: ANTHROPIC_API_KEY environment variable is required. Please add it to your .env file."
    );
    process.exit(1);
  }

  if (!process.env["OPENROUTER_API_KEY"]) {
    console.error(
      "Error: OPENROUTER_API_KEY environment variable is required. Please add it to your .env file."
    );
    process.exit(1);
  }

  const { llmIds, selectedPrompts, runsPerCombination, concurrencyLimit } =
    await getEvalParameters();

  if (!llmIds.length || !selectedPrompts.length || runsPerCombination <= 0) {
    console.log(
      "No models or prompts selected, or invalid number of runs. Exiting."
    );
    return;
  }

  // Build array of all task combinations
  const tasks: Array<{
    prompt: string;
    llmId: LlmId;
    runNumber: number;
  }> = [];

  for (const prompt of selectedPrompts) {
    for (const llmId of llmIds) {
      for (let i = 0; i < runsPerCombination; i++) {
        tasks.push({ prompt, llmId, runNumber: i + 1 });
      }
    }
  }

  console.log(
    `Running ${tasks.length} evaluations with concurrency limit of ${concurrencyLimit}...`
  );

  // Run tasks in parallel with concurrency limit
  const limit = pLimit(concurrencyLimit);
  const allResults = await Promise.all(
    tasks.map(({ prompt, llmId, runNumber }) =>
      limit(() => runSingleEval(prompt, llmId, runNumber, runsPerCombination))
    )
  );

  await saveResults(allResults);
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
