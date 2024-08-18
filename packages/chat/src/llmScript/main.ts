#!/usr/bin/env node
import { formatSquiggleCode, getSquiggleAdvice, runSquiggle } from "./helpers";
import { type Message, runLLM } from "./llmConfig";
import { LogLevel } from "./logManager";
import {
  CodeState,
  PerformanceMetrics,
  State,
  StateManager,
} from "./stateManager";

const MAX_ATTEMPTS = 10;

interface SquiggleResult {
  code: string;
  isValid: boolean;
  performanceMetrics: PerformanceMetrics;
  conversationHistory: Message[];
}

class SquiggleGenerator {
  public stateManager: StateManager;
  private prompt: string;
  private code: string = "";

  constructor(prompt: string) {
    this.prompt = prompt;
    this.stateManager = new StateManager();
    this.registerStateHandlers();
  }

  private registerStateHandlers() {
    this.stateManager.registerStateHandler(State.GENERATE_CODE, {
      execute: async () => {
        return await this.generateCode();
      },
    });

    this.stateManager.registerStateHandler(State.ENSURE_CODE_RUNS, {
      execute: async () => {
        return await this.validateCode();
      },
    });

    this.stateManager.registerStateHandler(State.GET_FEEDBACK_FROM_RUN, {
      execute: async () => {
        return await this.fixCode();
      },
    });
  }

  async run(): Promise<SquiggleResult> {
    let running = true;
    while (running) {
      running = await this.stateManager.next({
        prompt: this.prompt,
        maxAttempts: MAX_ATTEMPTS,
      });
    }

    const summary = this.stateManager.getExecutionSummary();

    return {
      code: this.code,
      isValid: this.stateManager.getCurrentState() === State.DONE,
      performanceMetrics: summary.totalPerformanceMetrics,
      conversationHistory: this.stateManager.getConversationHistory(),
    };
  }

  private async generateCode(): Promise<{
    codeState: CodeState;
    performanceMetrics: PerformanceMetrics;
  }> {
    try {
      const squiggleResult = await this.createSquiggleCode(this.prompt);

      if (!squiggleResult.code) {
        throw new Error("Failed to generate initial code");
      }

      this.code = squiggleResult.code;
      this.stateManager.transitionTo(State.ENSURE_CODE_RUNS);

      return {
        codeState: { type: "codeGenerated", code: this.code, errors: [] },
        performanceMetrics: squiggleResult.performanceMetrics,
      };
    } catch (error) {
      this.stateManager.log(
        `Error in generateCode: ${error.message}`,
        LogLevel.ERROR
      );
      this.stateManager.transitionTo(State.CRITICAL_ERROR);
      return {
        codeState: { type: "noCode" },
        performanceMetrics: {
          apiCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          durationMs: 0,
        },
      };
    }
  }

  private async validateCode(): Promise<{
    codeState: CodeState;
    performanceMetrics: PerformanceMetrics;
  }> {
    this.stateManager.log(
      `\n🧪 Attempt ${this.stateManager.getAttempts() + 1}/${MAX_ATTEMPTS}: Validating code...`,
      LogLevel.WARN
    );
    const run = await runSquiggle(this.code);

    if (run.ok) {
      this.stateManager.log(
        "RESULT:" + JSON.stringify(run.output, null, 4),
        LogLevel.INFO
      );
      this.stateManager.log("Code is valid!", LogLevel.SUCCESS);
      const formattedCode = await formatSquiggleCode(this.code);
      if (!formattedCode.ok) {
        this.stateManager.log(formattedCode.value, LogLevel.ERROR);
        this.stateManager.transitionTo(State.CRITICAL_ERROR);
      } else {
        this.code = formattedCode.value;
        this.stateManager.transitionTo(State.DONE);
        return {
          codeState: { type: "codeGenerated", code: this.code, errors: [] },
          performanceMetrics: {
            apiCalls: 1,
            inputTokens: 0,
            outputTokens: 0,
            durationMs: 0,
          },
        };
      }
    } else {
      this.stateManager.log("Validation error:", LogLevel.ERROR);
      run.value && this.stateManager.log(run.value, LogLevel.ERROR);
      this.stateManager.transitionTo(State.GET_FEEDBACK_FROM_RUN);
      return {
        codeState: {
          type: "codeGenerated",
          code: this.code,
          errors: [run.value],
        },
        performanceMetrics: {
          apiCalls: 1,
          inputTokens: 0,
          outputTokens: 0,
          durationMs: 0,
        },
      };
    }
  }

  private async fixCode(): Promise<{
    codeState: CodeState;
    performanceMetrics: PerformanceMetrics;
  }> {
    if (this.stateManager.getAttempts() >= MAX_ATTEMPTS) {
      this.stateManager.log(
        `Failed to generate valid Squiggle code after ${MAX_ATTEMPTS} attempts.`,
        LogLevel.ERROR
      );
      this.stateManager.transitionTo(State.CRITICAL_ERROR);
      return {
        codeState: {
          type: "codeGenerated",
          code: this.code,
          errors: ["Max attempts reached"],
        },
        performanceMetrics: {
          apiCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          durationMs: 0,
        },
      };
    }

    this.stateManager.log(
      "\n🔧 Attempting to fix the code...",
      LogLevel.HIGHLIGHT
    );

    try {
      const squiggleResult = await this.createSquiggleCode(
        this.prompt,
        this.code,
        "Error occurred"
      );

      if (!squiggleResult.code) {
        this.stateManager.log(
          "Failed to generate new code. Stopping attempts.",
          LogLevel.ERROR
        );
        this.stateManager.transitionTo(State.CRITICAL_ERROR);
        return {
          codeState: { type: "noCode" },
          performanceMetrics: squiggleResult.performanceMetrics,
        };
      }

      const formattedCode = await formatSquiggleCode(squiggleResult.code);
      if (!formattedCode.ok) {
        this.stateManager.log(formattedCode.value, LogLevel.ERROR);
        this.stateManager.transitionTo(State.CRITICAL_ERROR);
      } else {
        this.code = formattedCode.value;
        this.stateManager.log(this.code, LogLevel.INFO);
        this.stateManager.incrementAttempts();
        this.stateManager.transitionTo(State.ENSURE_CODE_RUNS);

        return {
          codeState: { type: "codeGenerated", code: this.code, errors: [] },
          performanceMetrics: squiggleResult.performanceMetrics,
        };
      }
    } catch (error) {
      this.stateManager.log(
        `Error during code fix attempt: ${error.message}`,
        LogLevel.ERROR
      );
      this.stateManager.transitionTo(State.CRITICAL_ERROR);
      return {
        codeState: { type: "noCode" },
        performanceMetrics: {
          apiCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          durationMs: 0,
        },
      };
    }
  }

  private async createSquiggleCode(
    prompt: string,
    existingCode = "",
    error = ""
  ): Promise<{ code: string; performanceMetrics: PerformanceMetrics }> {
    const userRequest = this.generateSquiggleUserRequest(
      prompt,
      existingCode,
      error
    );

    try {
      const conversationHistory = this.stateManager.getConversationHistory();
      conversationHistory.push({ role: "user", content: userRequest });
      const completion = await runLLM(conversationHistory);

      this.stateManager.log(JSON.stringify(completion, null, 2), LogLevel.INFO);

      if (
        !completion ||
        !completion.content ||
        completion.content.length === 0
      ) {
        this.stateManager.log(
          "Received an empty response from the API",
          LogLevel.ERROR
        );
        return {
          code: "",
          performanceMetrics: {
            apiCalls: 1,
            inputTokens: 0,
            outputTokens: 0,
            durationMs: 0,
          },
        };
      }

      const performanceMetrics: PerformanceMetrics = {
        apiCalls: 1,
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        durationMs: 0, // The StateManager will handle the duration
      };

      this.stateManager.log(
        `✨ Got response from OpenRouter ${existingCode ? "(fix attempt)" : "(initial generation)"}`,
        LogLevel.HIGHLIGHT
      );

      const message = completion.content;
      if (!message) {
        this.stateManager.log(
          "Received a response without content",
          LogLevel.ERROR
        );
        return { code: "", performanceMetrics };
      }

      const extractedCode = this.extractSquiggleCode(message);

      if (!extractedCode) {
        this.stateManager.log(
          "Error generating/fixing Squiggle code. Didn't get code.",
          LogLevel.ERROR
        );
        return { code: "", performanceMetrics };
      }

      conversationHistory.push({ role: "assistant", content: message });
      this.stateManager.setConversationHistory(conversationHistory);

      return { code: extractedCode, performanceMetrics };
    } catch (error) {
      this.stateManager.log(
        `Error in createSquiggleCode: ${error.message}`,
        LogLevel.ERROR
      );
      return {
        code: "",
        performanceMetrics: {
          apiCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          durationMs: 0,
        },
      };
    }
  }

  private generateSquiggleUserRequest(
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
        this.stateManager.log(`Advice: ${advice}`, LogLevel.INFO);
        content += `Advice: ${advice}\n\n`;
      }
    } else {
      content = `Generate Squiggle code for the following prompt. Produce mainly code with short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}.\n\n`;
    }

    return content;
  }

  private extractSquiggleCode(content: string): string {
    const match = content.match(/```squiggle([\s\S]*?)```/);
    return match ? match[1].trim() : "";
  }
}

export const runSquiggleGenerator = async (
  prompt: string
): Promise<SquiggleResult> => {
  const generator = new SquiggleGenerator(prompt);
  generator.stateManager.log("🚀 Squiggle Code Generator", LogLevel.INFO);
  generator.stateManager.log(`Prompt: ${prompt}`, LogLevel.INFO);

  try {
    const result = await generator.run();

    if (result.isValid) {
      generator.stateManager.log(
        "Successfully generated valid Squiggle code!",
        LogLevel.SUCCESS
      );
      generator.stateManager.log(result.code, LogLevel.INFO);
    } else {
      generator.stateManager.log(
        `Failed to generate valid Squiggle code after ${MAX_ATTEMPTS} attempts.`,
        LogLevel.ERROR
      );
      generator.stateManager.log(result.code, LogLevel.INFO);
    }

    return result;
  } catch (error) {
    generator.stateManager.log(
      "\n💥 An unexpected error occurred:",
      LogLevel.ERROR
    );
    generator.stateManager.log(error.toString(), LogLevel.ERROR);
    throw error;
  }
};
