#!/usr/bin/env node
//main.ts
import { generateAndSaveSummary } from "./generateSummary";
import { formatSquiggleCode, getSquiggleAdvice, runSquiggle } from "./helpers";
import { runLLM } from "./llmConfig";
import {
  CodeState,
  LogEntry,
  LogLevel,
  State,
  StateExecution,
  StateManager,
} from "./stateManager";

// Enhance function with types
function truncateAndFormatData(jsonData: any): any {
  // Set the threshold for array length and number of significant figures
  const maxArrayLength = 20;
  const significantFigures = 4;

  // Helper function to format numbers to significant figures
  function toSignificantFigures(num: number, sigFigs: number): number {
    if (num === 0) return 0;
    const d = Math.ceil(Math.log10(num < 0 ? -num : num));
    const power = sigFigs - d;
    const magnitude = Math.pow(10, power);
    const shifted = Math.round(num * magnitude);
    return shifted / magnitude;
  }

  // Helper function to process array
  function processArray(arr: number[]): (number | string)[] {
    const formattedArray = arr.map((num) =>
      typeof num === "number"
        ? toSignificantFigures(num, significantFigures)
        : num
    );
    if (formattedArray.length > maxArrayLength) {
      return [...formattedArray.slice(0, maxArrayLength), "..."];
    }
    return formattedArray;
  }

  // Process and format the data
  try {
    if (jsonData && typeof jsonData === "object") {
      if (jsonData.vtype === "Dict" && jsonData.value && jsonData.value.foo) {
        if (Array.isArray(jsonData.value.foo)) {
          jsonData.value.foo = processArray(jsonData.value.foo);
        }
      }
    }
    return jsonData;
  } catch (error) {
    console.error("Error in truncateAndFormatData:", error);
    return jsonData; // Return the original data if there's an error
  }
}

// Sample JSON data
const jsonData = {
  vtype: "Dict",
  value: {
    foo: [
      4.248299088001309, 3.283777682976534, 3.5641257696299684,
      6.9298914061959715, 1.5420968298322872, 2.4360400029254876,
      2.190185578450418, 5.50633457136622, 3.559258628728251, 4.335418029933416,
      2.1564742513787385, 3.096953741391773, 7.601348445876665,
      3.0022899716229774, 3.1673031755646255, 4.953070684458059,
      5.375524596548717, 2.3275126363308303, 3.495475615335954,
      3.4254426916884233, 6.554585787065609, 3.126424953698332,
      // Add more numbers as needed
    ],
  },
};

// Process the JSON data
const processedData = truncateAndFormatData(jsonData);

// Output the processed data
console.log(JSON.stringify(processedData, null, 2));

function generateSquiggleUserRequest(
  prompt: string,
  existingCode: string,
  error: string
): string {
  const isFixing = Boolean(existingCode);
  const advice = getSquiggleAdvice(error, existingCode);

  let content = "";

  if (isFixing) {
    content = `That code produced the following error. Write a full new model that fixes that error. ${error}\n\n`;
    if (advice) {
      content += `Advice: ${advice}\n\n`;
    }
  } else {
    content = `Generate Squiggle code for the following prompt. Produce only code, no explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}.\n\n`;
  }

  return content;
}

function extractSquiggleCode(content: string): string {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

async function formatAndRunSquiggle(code: string): Promise<CodeState> {
  const formattedCode = await formatSquiggleCode(code);
  if (!formattedCode.ok) {
    return { type: "formattingFailed", code, error: formattedCode.value };
  }
  const run = await runSquiggle(formattedCode.value);
  if (run.ok) {
    return { type: "success", code: formattedCode.value };
  } else {
    return {
      type: "runFailed",
      code: formattedCode.value,
      error: run.value,
    };
  }
}

function codeStateNextState(codeState: CodeState): State {
  return codeState.type === "success"
    ? State.ADJUST_TO_FEEDBACK
    : State.FIX_CODE_UNTIL_IT_RUNS;
}

class SquiggleGenerator {
  public stateManager: StateManager;
  private prompt: string;

  constructor(prompt: string) {
    this.prompt = prompt;
    this.stateManager = new StateManager();
    this.registerStateHandlers();
  }

  private registerStateHandlers() {
    this.stateManager.registerStateHandler(State.GENERATE_CODE, {
      execute: async (stateExecution) => {
        await this.generateCode(stateExecution);
      },
    });

    this.stateManager.registerStateHandler(State.FIX_CODE_UNTIL_IT_RUNS, {
      execute: async (stateExecution) => {
        await this.fixCodeUntilItRuns(stateExecution);
      },
    });

    this.stateManager.registerStateHandler(State.ADJUST_TO_FEEDBACK, {
      execute: async (stateExecution) => {
        await this.adjustToFeedback(stateExecution);
      },
    });
  }

  async run(): Promise<void> {
    while (true) {
      const { continueExecution } = await this.stateManager.step();
      if (!continueExecution) break;
    }
  }

  private async generateCode(stateExecution: StateExecution): Promise<void> {
    await this.createSquiggleCodeAndUpdateStateExecution(
      this.prompt,
      stateExecution
    );
  }

  private async fixCodeUntilItRuns(
    stateExecution: StateExecution
  ): Promise<void> {
    const { codeState } = stateExecution;

    if (codeState.type === "success") {
      stateExecution.log(
        "Code is already successful, moving to Feedback state",
        LogLevel.INFO
      );
      stateExecution.updateNextState(State.ADJUST_TO_FEEDBACK);
      return;
    }

    let code: string;
    let error: string | undefined;

    switch (codeState.type) {
      case "formattingFailed":
      case "runFailed":
        code = codeState.code;
        error = codeState.error;
        break;
      default:
        stateExecution.log(
          "Unexpected code state in FIX_CODE_UNTIL_IT_RUNS",
          LogLevel.ERROR
        );
        stateExecution.updateNextState(State.GENERATE_CODE);
        return;
    }

    await this.createSquiggleCodeAndUpdateStateExecution(
      this.prompt,
      stateExecution,
      code,
      error || ""
    );
  }

  private async createSquiggleCodeAndUpdateStateExecution(
    prompt: string,
    stateExecution: StateExecution,
    existingCode = "",
    error = ""
  ): Promise<void> {
    const userRequest = generateSquiggleUserRequest(
      prompt,
      existingCode,
      error
    );

    function failAndRedoState(message: string) {
      stateExecution.log(message, LogLevel.ERROR);
      stateExecution.updateCodeState({ type: "noCode" });
      stateExecution.updateNextState(State.GENERATE_CODE);
    }

    try {
      stateExecution.addConversationMessage({
        role: "user",
        content: userRequest,
      });

      const completion = await runLLM(
        this.stateManager.getConversationMessages()
      );

      stateExecution.updateLlmMetrics({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens || 0,
        outputTokens: completion?.usage?.completion_tokens || 0,
      });

      stateExecution.addConversationMessage({
        role: "assistant",
        content: completion?.content || "no response",
      });

      if (
        !completion ||
        !completion.content ||
        completion.content.length === 0
      ) {
        failAndRedoState("Received an empty response from the API");
        return;
      }

      stateExecution.log(JSON.stringify(completion, null, 2), LogLevel.INFO);

      stateExecution.log(
        `✨ Got response from OpenRouter ${existingCode ? "(fix attempt)" : "(initial generation)"}`,
        LogLevel.HIGHLIGHT
      );

      const extractedCode = extractSquiggleCode(completion.content);

      if (!extractedCode) {
        failAndRedoState(
          "Error generating/fixing Squiggle code. Didn't get code."
        );
        return;
      }

      const codeState = await formatAndRunSquiggle(extractedCode);
      stateExecution.updateCodeState(codeState);
      stateExecution.updateNextState(codeStateNextState(codeState));
    } catch (error) {
      failAndRedoState(
        `Error in createSquiggleCodeAndUpdateStateExecution: ${error.message}`
      );
    }
  }

  private async adjustToFeedback(
    stateExecution: StateExecution
  ): Promise<void> {
    const { codeState } = stateExecution;

    if (codeState.type !== "success") {
      stateExecution.criticalError(
        "Entered Adjust To Feedback stage without a good code state"
      );
      return;
    }

    const currentCode = codeState.code!;

    const runResult = await runSquiggle(currentCode);

    if (!runResult.ok) {
      stateExecution.criticalError(
        "Entered Adjust To Feedback stage without a good code state"
      );
      return;
    }
    const bindings = JSON.stringify(
      truncateAndFormatData(runResult.output.bindings),
      null,
      2
    );
    const result = JSON.stringify(
      truncateAndFormatData(runResult.output.result),
      null,
      2
    );

    const adjustmentPrompt = `The following Squiggle code produced this output:

Code:
${currentCode}

Output:

variables: ${bindings}

result: ${result}

Analyze the code and its output. Do you think the code needs adjustment? If not, respond with exactly "NO_ADJUSTMENT_NEEDED". If yes, please provide the full adjusted code. Consider unexpected results, failing tests, or any improvements that could be made based on the output.`;

    const userRequest = adjustmentPrompt;

    try {
      stateExecution.addConversationMessage({
        role: "user",
        content: userRequest,
      });

      const completion = await runLLM(
        this.stateManager.getConversationMessages()
      );

      stateExecution.log("got back LLM response", LogLevel.INFO);
      stateExecution.log(JSON.stringify(completion, null, 2), LogLevel.INFO);

      stateExecution.updateLlmMetrics({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens || 0,
        outputTokens: completion?.usage?.completion_tokens || 0,
      });

      stateExecution.addConversationMessage({
        role: "assistant",
        content: completion?.content || "no response",
      });

      if (
        !completion ||
        !completion.content ||
        completion.content.length === 0
      ) {
        stateExecution.log(
          "Received an empty response from the API",
          LogLevel.ERROR
        );
        stateExecution.updateNextState(State.FIX_CODE_UNTIL_IT_RUNS);
        return;
      }

      const response = completion.content.trim();

      const noAdjustmentRegex = /no\s+adjust(?:ment)?\s+needed/i;
      const isShortResponse = response.length <= 100; // Adjust this threshold as needed

      if (noAdjustmentRegex.test(response) && isShortResponse) {
        stateExecution.log(
          "LLM determined no adjustment is needed",
          LogLevel.INFO
        );
        stateExecution.updateNextState(State.DONE);
        return;
      }

      stateExecution.log("LLM response: " + response, LogLevel.INFO);
      const extractedCode = extractSquiggleCode(response);

      if (!extractedCode) {
        stateExecution.log(
          "No code adjustments provided. Considering process complete.",
          LogLevel.INFO
        );
        stateExecution.updateNextState(State.DONE);
        return;
      }

      const newCodeState = await formatAndRunSquiggle(extractedCode);
      stateExecution.updateCodeState(newCodeState);
      stateExecution.updateNextState(
        newCodeState.type === "success"
          ? State.DONE
          : State.FIX_CODE_UNTIL_IT_RUNS
      );
    } catch (error) {
      stateExecution.log(
        `Error in adjustToFeedback: ${error.message}`,
        LogLevel.ERROR
      );
      stateExecution.updateNextState(State.FIX_CODE_UNTIL_IT_RUNS);
    }
  }
}

export interface SquiggleResult {
  isValid: boolean;
  code: string;
  logs: LogEntry[];
}

export const runSquiggleGenerator = async (
  prompt: string
): Promise<SquiggleResult> => {
  const generator = new SquiggleGenerator(prompt);
  try {
    await generator.run();

    generateAndSaveSummary(generator.stateManager);

    return generator.stateManager.getFinalResult();
  } catch (error) {
    const stateExecution = generator.stateManager.getCurrentStateExecution();
    stateExecution.criticalError(
      "runSquiggleGenerator error:" + error.toString()
    );

    generateAndSaveSummary(generator.stateManager);

    throw error;
  }
};
