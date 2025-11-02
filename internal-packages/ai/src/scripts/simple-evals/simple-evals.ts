import { config } from 'dotenv';
import fs from 'fs';

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
  // "Claude-3-5-Haiku",
  // "Claude-4-5-Haiku",
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

async function instantiateAndRunWorkflow(prompt: string, llmId: LlmId) {
  const llmConfig = getLlmConfig(llmId);
  return createSquiggleWorkflowTemplate
    .instantiate({
      inputs: { prompt: new PromptArtifact(prompt) },
      openaiApiKey: process.env['OPENAI_API_KEY'],
      anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
      openRouterApiKey: process.env['OPENROUTER_API_KEY'],
      llmConfig,
    })
    .runToResult();
}

type WorkflowResult = { totalPrice: number; runTimeMs: number; llmRunCount: number; code: unknown; isValid: boolean; logSummary: any };

function toEvalResult({ totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary }: WorkflowResult, prompt: string, llmId: LlmId): EvalResult {
  const finalCode = typeof code === 'string' ? code : '';
  const linesOfCode = finalCode.split('\n').length;

  return {
    prompt,
    modelName: llmId,
    dateRan: new Date().toISOString(),
    succeeded: isValid,
    cost: totalPrice,
    timeOfCompletionMs: runTimeMs,
    llmRunCount,
    linesOfCode,
    finalCode,
    logSummary,
  };
}

async function runSingleEval(prompt: string, llmId: LlmId, runNumber: number, totalRuns: number): Promise<EvalResult> {
  console.log(`Running prompt: "${prompt}" with LLM: ${llmId}, run ${runNumber}/${totalRuns}`);

  try {
    const workflowResult: WorkflowResult = await instantiateAndRunWorkflow(prompt, llmId);
    const result = toEvalResult(workflowResult, prompt, llmId);
    console.log(`Finished run. Success: ${result.succeeded}, Cost: ${result.cost}`);
    return result;
  } catch (error) {
    console.error(`Error running prompt: "${prompt}" with LLM: ${llmId}, run ${runNumber}`, error);
    const result: EvalResult = {
      prompt,
      modelName: llmId,
      dateRan: new Date().toISOString(),
      succeeded: false,
      error: error instanceof Error ? error.message : String(error),
    };
    return result;
  }
}

function saveResults(results: EvalResult[]) {
  const outputFilename = `eval-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(outputFilename, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${outputFilename}`);
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

  saveResults(allResults);
}

main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
