#!/usr/bin/env node
import { getSquiggleAdvice, runSquiggle, squiggleDocs } from "./helpers.mts";
import { runLLM } from "./llmConfig.mts";
import { Logger } from "./logger.mts";

const MAX_ATTEMPTS = 10;

// Tracking info
const trackingInfo = {
  time: { createSquiggleCode: 0, validateAndFixCode: 0 },
  tokens: { input: 0, output: 0 },
};

const extractSquiggleCode = (content) => {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
};

const measureTime = async (fn) => {
  const start = Date.now();
  const result = await fn();
  const duration = (Date.now() - start) / 1000;
  return { result, duration };
};

const updateTrackingInfo = (duration, usage) => {
  trackingInfo.time.createSquiggleCode += duration;
  trackingInfo.tokens.input += usage.prompt_tokens;
  trackingInfo.tokens.output += usage.completion_tokens;
};

const generateSquiggleContent = (
  prompt: string,
  existingCode: string,
  error: string
): string => {
  const isFixing = Boolean(existingCode);
  const advice = getSquiggleAdvice(error);

  if (isFixing) {
    let content = `Fix the following Squiggle code. It produced this error: ${error}\n\nCode:\n${existingCode}\n\n`;
    if (advice) {
      Logger.log(`Advice: ${advice}`);
      content += `Advice: ${advice}\n\n`;
    }
    content += `Explain your thinking in detail. Think step by step. Wrap the code in \`\`\`squiggle tags.\n\nInformation on Squiggle Language:\n\n\n${squiggleDocs}`;
    return content;
  } else {
    return `Generate Squiggle code for the following prompt. Mainly produce code, short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}.\n\n\nInformation about the Squiggle Language:\n\n\n${squiggleDocs}`;
  }
};

const createSquiggleCode = async (prompt, existingCode = "", error = "") => {
  const content = generateSquiggleContent(prompt, existingCode, error);
  const { result: completion, duration } = await measureTime(async () =>
    runLLM(content)
  );

  updateTrackingInfo(duration, completion.usage);
  Logger.highlight(
    `✨ Got response from OpenRouter ${existingCode ? "(fix attempt)" : "(initial generation)"}`
  );

  const extractedCode = extractSquiggleCode(
    completion.choices[0].message.content
  );
  if (!extractedCode) {
    Logger.error("Error generating/fixing Squiggle code. Didn't get code.");
  }
  return extractedCode;
};

const validateAndFixCode = async (prompt, initialCode) => {
  let code = initialCode;
  let isValid = false;
  let attempts = 0;

  while (!isValid && attempts < MAX_ATTEMPTS) {
    Logger.warn(
      `\n🧪 Attempt ${attempts + 1}/${MAX_ATTEMPTS}: Validating code...`
    );
    const run = await runSquiggle(code);

    if (run.ok) {
      isValid = true;
      Logger.success("Code is valid!");
    } else {
      Logger.error("Validation error:");
      run.value && Logger.errorBox(run.value);
      Logger.highlight("\n🔧 Attempting to fix the code...");

      const { result: newCode, duration } = await measureTime(() =>
        createSquiggleCode(prompt, code, run.value)
      );
      trackingInfo.time.validateAndFixCode += duration;
      code = newCode;

      Logger.code(code, "Fixed Code:");
      attempts++;
    }
  }

  return { isValid, code };
};

// Main function
const main = async () => {
  const prompt =
    "Make a model to estimate the costs and benefits of flying from SFO to London.\n\n" +
    "Keep this part simple. Do not use any annotations ('@name', '@doc'), do not use domains (i.e. f(t: [2,3])), do not use custom visualizations or calculators yet. Just get the core functionality right. Use the sTest library for tests.";

  Logger.info("\n🚀 Starting Squiggle Code Generation\n");
  Logger.log(`Prompt: ${prompt}`);

  Logger.highlight("\n📝 Generating initial Squiggle code...");
  const { result: initialCode, duration } = await measureTime(() =>
    createSquiggleCode(prompt)
  );
  trackingInfo.time.createSquiggleCode += duration;
  Logger.code(initialCode, "Generated Code:");

  const { isValid, code } = await validateAndFixCode(prompt, initialCode);

  Logger.info("\n🏁 Final Result:");
  if (isValid) {
    Logger.success("Successfully generated valid Squiggle code!");
    Logger.code(code, "Final Valid Squiggle Code:");
  } else {
    Logger.error(
      `Failed to generate valid Squiggle code after ${MAX_ATTEMPTS} attempts.`
    );
  }

  Logger.summary(trackingInfo);
};

// Run the main function
main().catch((error) => {
  Logger.error("\n💥 An unexpected error occurred:");
  Logger.error(error.toString());
});
