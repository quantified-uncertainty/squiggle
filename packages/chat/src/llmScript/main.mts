#!/usr/bin/env node
import { getSquiggleAdvice, runSquiggle, squiggleDocs } from "./helpers.mts";
import { runLLM } from "./llmConfig.mts";
import { Logger } from "./logger.mts";

const MAX_ATTEMPTS = 15;

const trackingInfo = {
  time: {
    createSquiggleCode: 0,
    validateAndFixCode: 0,
  },
  tokens: {
    input: 0,
    output: 0,
  },
};

const generateSquiggleContent = (
  prompt: string,
  existingCode: string,
  error: string
): string => {
  const isFixing = Boolean(existingCode);
  const advice = getSquiggleAdvice(error);

  let content = "";

  if (isFixing) {
    content = `Fix the following Squiggle code, by producing a full new Squiggle model. It produced this error: ${error}\n\nCode:\n${existingCode}\n\n`;
    if (advice) {
      Logger.log(`Advice: ${advice}`);
      content += `Advice: ${advice}\n\n`;
    }
  } else {
    content = `Generate Squiggle code for the following prompt. Produce mainly code with short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}.\n\n`;
    content += `Information about the Squiggle Language:\n\n${squiggleDocs}`;
  }

  // Logger.logPrompt(content);
  return content;
};

const updateTrackingInfo = (
  duration: number,
  usage?: { prompt_tokens?: number; completion_tokens?: number }
) => {
  trackingInfo.time.createSquiggleCode += duration;
  if (usage) {
    trackingInfo.tokens.input += usage.prompt_tokens || 0;
    trackingInfo.tokens.output += usage.completion_tokens || 0;
  }
};

const createSquiggleCode = async (
  prompt: string,
  existingCode = "",
  error = ""
) => {
  const content = generateSquiggleContent(prompt, existingCode, error);
  try {
    const { result: completion, duration } = await measureTime(async () =>
      runLLM(content, existingCode ? "user" : "system")
    );

    Logger.logLLMResponse(JSON.stringify(completion, null, 2), duration);

    if (!completion || !completion.choices || completion.choices.length === 0) {
      Logger.error("Received an empty response from the API");
      return "";
    }

    updateTrackingInfo(duration, completion.usage);
    Logger.highlight(
      `✨ Got response from OpenRouter ${existingCode ? "(fix attempt)" : "(initial generation)"}`
    );

    const message = completion.choices[0].message;
    if (!message || !message.content) {
      Logger.error("Received a response without content");
      return "";
    }

    const extractedCode = extractSquiggleCode(message.content);
    if (!extractedCode) {
      Logger.error("Error generating/fixing Squiggle code. Didn't get code.");
      return "";
    }
    return extractedCode;
  } catch (error) {
    Logger.error(`Error in createSquiggleCode: ${error.message}`);
    return "";
  }
};

const extractSquiggleCode = (content: string): string => {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
};

const validateAndFixCode = async (prompt: string, initialCode: string) => {
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

      try {
        const { result: newCode, duration } = await measureTime(() =>
          createSquiggleCode(prompt, code, run.value)
        );
        trackingInfo.time.validateAndFixCode += duration;

        if (!newCode) {
          Logger.error("Failed to generate new code. Stopping attempts.");
          break;
        }

        code = newCode;
        Logger.code(code, "Fixed Code:");
      } catch (error) {
        Logger.error(`Error during code fix attempt: ${error.message}`);
        break;
      }
    }
    attempts++;
  }

  return { isValid, code };
};

const measureTime = async <T,>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};

const main = async () => {
  const prompt =
    "write a Squiggle function that describes the probability that a US male will get die from different diseases over their lifetimes. It should have a function that takes in (birthday, year, cause), and outputs the probability that they will die at that time due to that cause. It then should visualize this in a few different ways.";

  Logger.initNewLog();
  Logger.info("🚀 Squiggle Code Generator");
  Logger.info(`Prompt: ${prompt}`);

  try {
    Logger.highlight("\n📝 Generating initial Squiggle code...");
    const { result: initialCode, duration } = await measureTime(() =>
      createSquiggleCode(prompt)
    );
    trackingInfo.time.createSquiggleCode += duration;

    if (!initialCode) {
      throw new Error("Failed to generate initial code");
    }

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
      Logger.code(code, "Last attempted code:");
    }

    Logger.summary(trackingInfo);
  } catch (error) {
    Logger.error("\n💥 An error occurred during code generation:");
    Logger.error(error.toString());
  }
};

// Run the main function
main().catch((error) => {
  Logger.error("\n💥 An unexpected error occurred:");
  Logger.error(error.toString());
});
