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
    content = `Generate Squiggle code for the following prompt. Produce mainly code with short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}.\n\n`;
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
    ? State.DONE
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
    let code: string;
    let error: string | undefined;

    switch (stateExecution.codeState.type) {
      case "formattingFailed":
      case "runFailed":
        code = stateExecution.codeState.code;
        error = stateExecution.codeState.error;
        break;
      default:
        stateExecution.criticalError("Invalid code state");
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

    function failAndRedoState(message) {
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
