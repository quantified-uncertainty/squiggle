#!/usr/bin/env node
import { formatSquiggleCode, getSquiggleAdvice, runSquiggle } from "./helpers";
import { type Message, runLLM } from "./llmConfig";
import { Logger } from "./logger";

const MAX_ATTEMPTS = 10;

interface TrackingInfo {
  time: {
    createSquiggleCode: number;
    validateAndFixCode: number;
  };
  tokens: {
    input: number;
    output: number;
  };
}

interface SquiggleResult {
  code: string;
  isValid: boolean;
  trackingInfo: TrackingInfo;
  conversationHistory: Message[];
}

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

const generateSquiggleUserRequest = (
  prompt: string,
  existingCode: string,
  error: string
): string => {
  const isFixing = Boolean(existingCode);
  const advice = getSquiggleAdvice(error, existingCode);

  let content = "";

  if (isFixing) {
    content = `That code produced the following error. Write a full new model that fixes that error. ${error}\n\n`;
    if (advice) {
      Logger.log(`Advice: ${advice}`);
      content += `Advice: ${advice}\n\n`;
    }
  } else {
    content = `Generate Squiggle code for the following prompt. Produce mainly code with short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}.\n\n`;
  }

  return content;
};

const createSquiggleCode = async (
  prompt: string,
  existingCode = "",
  error = "",
  trackingInfo: TrackingInfo,
  conversationHistory: Message[]
): Promise<SquiggleResult> => {
  const userRequest = generateSquiggleUserRequest(prompt, existingCode, error);

  try {
    conversationHistory.push({ role: "user", content: userRequest });
    const { result: completion, duration } = await measureTime(async () =>
      runLLM(conversationHistory)
    );

    Logger.logLLMResponse(JSON.stringify(completion, null, 2), duration);

    if (!completion || !completion.content || completion.content.length === 0) {
      Logger.error("Received an empty response from the API");
      return { code: "", trackingInfo, conversationHistory, isValid: false };
    }

    trackingInfo.time.createSquiggleCode += duration;
    trackingInfo.tokens.input += completion.usage?.prompt_tokens || 0;
    trackingInfo.tokens.output += completion.usage?.completion_tokens || 0;

    Logger.highlight(
      `✨ Got response from OpenRouter ${existingCode ? "(fix attempt)" : "(initial generation)"}`
    );

    const message = completion.content;
    if (!message) {
      Logger.error("Received a response without content");
      return { code: "", trackingInfo, conversationHistory, isValid: false };
    }

    const extractedCode = extractSquiggleCode(message);

    if (!extractedCode) {
      Logger.error("Error generating/fixing Squiggle code. Didn't get code.");
      return { code: "", trackingInfo, conversationHistory, isValid: false };
    }

    // Add the assistant's response to the conversation history
    conversationHistory.push({ role: "assistant", content: message });

    return {
      code: extractedCode,
      trackingInfo,
      conversationHistory,
      isValid: true,
    };
  } catch (error) {
    Logger.error(`Error in createSquiggleCode: ${error.message}`);
    return { code: "", trackingInfo, conversationHistory, isValid: false };
  }
};

const extractSquiggleCode = (content: string): string => {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
};

const validateAndFixCode = async (
  prompt: string,
  initialCode: string,
  trackingInfo: TrackingInfo,
  conversationHistory: Message[]
): Promise<{
  isValid: boolean;
  code: string;
  trackingInfo: TrackingInfo;
  conversationHistory: Message[];
}> => {
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
      // Format the valid code
      code = await formatSquiggleCode(code);
    } else {
      Logger.error("Validation error:");
      run.value && Logger.errorBox(run.value);
      Logger.highlight("\n🔧 Attempting to fix the code...");

      try {
        const { result: squiggleResult, duration } = await measureTime(() =>
          createSquiggleCode(
            prompt,
            code,
            run.value,
            trackingInfo,
            conversationHistory
          )
        );
        trackingInfo = squiggleResult.trackingInfo;
        conversationHistory = squiggleResult.conversationHistory;
        trackingInfo.time.validateAndFixCode += duration;

        if (!squiggleResult.code) {
          Logger.error("Failed to generate new code. Stopping attempts.");
          break;
        }

        // Format the new code
        code = await formatSquiggleCode(squiggleResult.code);
        Logger.code(code, "Fixed and Formatted Code:");
      } catch (error) {
        Logger.error(`Error during code fix attempt: ${error.message}`);
        break;
      }
    }
    attempts++;
  }

  return { isValid, code, trackingInfo, conversationHistory };
};

const measureTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};

const main = async (prompt: string): Promise<SquiggleResult> => {
  let trackingInfo: TrackingInfo = {
    time: { createSquiggleCode: 0, validateAndFixCode: 0 },
    tokens: { input: 0, output: 0 },
  };
  let conversationHistory: Message[] = [];

  try {
    const { result: squiggleResult, duration } = await measureTime(() =>
      createSquiggleCode(prompt, "", "", trackingInfo, conversationHistory)
    );
    trackingInfo = squiggleResult.trackingInfo;
    conversationHistory = squiggleResult.conversationHistory;
    trackingInfo.time.createSquiggleCode += duration;

    if (!squiggleResult.code) {
      throw new Error("Failed to generate initial code");
    }

    const {
      isValid,
      code,
      trackingInfo: updatedTrackingInfo,
      conversationHistory: updatedConversationHistory,
    } = await validateAndFixCode(
      prompt,
      squiggleResult.code,
      trackingInfo,
      conversationHistory
    );

    return {
      code,
      isValid,
      trackingInfo: updatedTrackingInfo,
      conversationHistory: updatedConversationHistory,
    };
  } catch (error) {
    return {
      code: "",
      isValid: false,
      trackingInfo,
      conversationHistory,
    };
  }
};

// New function to handle logging and running the main function
export const runSquiggleGenerator = async (
  prompt: string
): Promise<SquiggleResult> => {
  Logger.initNewLog();
  Logger.info("🚀 Squiggle Code Generator");
  Logger.info(`Prompt: ${prompt}`);

  try {
    const result = await main(prompt);

    if (result.isValid) {
      Logger.success("Successfully generated valid Squiggle code!");
      Logger.code(result.code, "Final Valid Squiggle Code:");
    } else {
      Logger.error(
        `Failed to generate valid Squiggle code after ${MAX_ATTEMPTS} attempts.`
      );
      Logger.code(result.code, "Last attempted code:");
    }

    Logger.logConversationHistory(result.conversationHistory);
    Logger.summary(result.trackingInfo);
    return result;
  } catch (error) {
    Logger.error("\n💥 An unexpected error occurred:");
    Logger.error(error.toString());
  }
};

// await runSquiggleGenerator("Write a 3-line function on financial forecasting");
