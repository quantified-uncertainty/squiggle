import { config } from 'dotenv';
import fs from 'fs';
import * as csv from 'fast-csv';

import { PromptArtifact } from '../../Artifact.js';
import { createSquiggleWorkflowTemplate } from '../../workflows/createSquiggleWorkflowTemplate.js';
import { LlmId } from '../../modelConfigs.js';

config();

const prompts = [
  'Simple financial projections for a new bubble tea shop in Berkeley CA',
  // "Estimate total money saved by autonomous vehicles",
  // "Piano tuners in Chicago",
  // "Total length of blood vessels in human body",
  // "Annual revenue of all McDonald’s locations worldwide",
];

const llmIds: LlmId[] = [
  'Claude-4-5-Sonnet',
  // "Claude-4-5-Haiku",
  // "Claude-3-5-Haiku",
  // "Claude-3-7-Sonnet",
  // "Grok-Code-Fast-1",
];

const RUNS_PER_COMBINATION = 1;

type EvalResult = {
  prompt: string;
  modelName: LlmId;
  dateRan: string;
  succeeded: boolean;
  cost?: number;
  timeOfCompletionMs?: number;
  llmRunCount?: number;
  linesOfCode?: number;
  finalCode?: string;
  logSummary?: any; // logSummary is complex
  error?: string;
};

function getLlmConfig(llmId: LlmId) {
  return { llmId, priceLimit: 0.3, durationLimitMinutes: 2, messagesInHistoryToKeep: 4, numericSteps: 3, styleGuideSteps: 2 };
}

function getParams(prompt: string, llmId: LlmId) {
  const llmConfig = getLlmConfig(llmId);
  const prompArtifact = new PromptArtifact(prompt);

  return {
    inputs: { prompt: prompArtifact },
    openaiApiKey: process.env['OPENAI_API_KEY'],
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    openRouterApiKey: process.env['OPENROUTER_API_KEY'],
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

function toEvalResult({ totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary }: WorkflowResult, prompt: string, llmId: LlmId): EvalResult {
  const linesOfCode = code.split('\n').length;

  return {
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

function toErrorResult(prompt: string, llmId: LlmId, error: unknown): EvalResult {
  return {
    prompt,
    modelName: llmId,
    dateRan: new Date().toISOString(),
    succeeded: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

async function runSingleEval(prompt: string, llmId: LlmId, runNumber: number, totalRuns: number): Promise<EvalResult> {
  console.log(`Running prompt: "${prompt}" with LLM: ${llmId}, run ${runNumber}/${totalRuns}`);

  try {
    const workflow = await createWorkflow(prompt, llmId);
    const workflowResult = await workflow.runToResult();
    const result = toEvalResult(workflowResult, prompt, llmId);

    console.log(`Finished run. Success: ${result.succeeded}, Cost: ${result.cost}`);
    
    return result;
  } catch (error) {
    console.error(`Error running prompt: "${prompt}" with LLM: ${llmId}, run ${runNumber}`, error);
    
    const result = toErrorResult(prompt, llmId, error);
    
    return result;
  }
}

function saveResults(results: EvalResult[]): Promise<void> {
  const baseName = `eval-results-${new Date().toISOString().replace(/:/g, '-')}`;

  const jsonFilename = `${baseName}.json`;
  fs.writeFileSync(jsonFilename, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${jsonFilename}`);

  return new Promise((resolve, reject) => {
    const csvFilename = `${baseName}.csv`;
    const csvStream = csv.format({ headers: true });
    const writableStream = fs.createWriteStream(csvFilename);

    writableStream.on('finish', () => {
      console.log(`Results saved to ${csvFilename}`);
      resolve();
    });
    writableStream.on('error', reject);

    csvStream.pipe(writableStream);

    results.forEach(result => {
      const { finalCode, logSummary, ...csvResult } = result;
      csvStream.write(csvResult);
    });

    csvStream.end();
  });
}

async function main() {
  const allResults: EvalResult[] = [];

  for (const prompt of prompts) {
    for (const llmId of llmIds) {
      for (let i = 0; i < RUNS_PER_COMBINATION; i++) {
        const result = await runSingleEval(prompt, llmId, i + 1, RUNS_PER_COMBINATION);
        allResults.push(result);
      }
    }
  }

  await saveResults(allResults);
}

main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
