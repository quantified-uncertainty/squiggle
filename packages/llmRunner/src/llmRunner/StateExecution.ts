import chalk from "chalk";

import { SqError, SqProject } from "@quri/squiggle-lang";

import { LlmMetrics, Message } from "./LLMClient";
import { StateManager } from "./StateManager";

export type LogEntry =
  | InfoLogEntry
  | WarnLogEntry
  | ErrorLogEntry
  | CodeRunErrorLogEntry
  | SuccessLogEntry
  | HighlightLogEntry
  | LlmResponseLogEntry
  | CodeStateLogEntry;

export function getLogEntryFullName(entry: LogEntry): string {
  switch (entry.type) {
    case "info":
      return "ℹ️ Information";
    case "warn":
      return "⚠️ Warning";
    case "error":
      return "🚫 System Error";
    case "codeRunError":
      return "❌ Code Run Error";
    case "success":
      return "✅ Success";
    case "highlight":
      return "🔆 Highlight";
    case "llmResponse":
      return "🤖 LLM Response";
    case "codeState":
      return "📄 Code State";
    default:
      return `❓ Unknown (${entry satisfies never})`;
  }
}

export type TimestampedLogEntry = {
  timestamp: Date;
  entry: LogEntry;
};

type InfoLogEntry = {
  type: "info";
  message: string;
};

type WarnLogEntry = {
  type: "warn";
  message: string;
};

type ErrorLogEntry = {
  type: "error";
  message: string;
};

type CodeRunErrorLogEntry = {
  type: "codeRunError";
  error: string;
};

type SuccessLogEntry = {
  type: "success";
  message: string;
};

type HighlightLogEntry = {
  type: "highlight";
  message: string;
};

type LlmResponseLogEntry = {
  type: "llmResponse";
  response: any; // JSON response
  content: string;
  messages: Message[];
  prompt: string;
};

type CodeStateLogEntry = {
  type: "codeState";
  codeState: CodeState;
};

export enum State {
  START,
  GENERATE_CODE,
  FIX_CODE_UNTIL_IT_RUNS,
  ADJUST_TO_FEEDBACK,
  DONE,
  CRITICAL_ERROR,
}

export type CodeState =
  | { type: "noCode" }
  | {
      type: "formattingFailed";
      error: string;
      code: string;
    }
  | { type: "runFailed"; code: string; error: SqError; project: SqProject }
  | { type: "success"; code: string };

export function codeStateErrorString(codeState: CodeState): string {
  if (codeState.type === "formattingFailed") {
    return codeState.error;
  } else if (codeState.type === "runFailed") {
    return codeState.error.toStringWithDetails();
  }
  return "";
}

export interface StateHandler {
  execute: (stateExecution: StateExecution) => Promise<void>;
}

function displayLog(log: LogEntry): void {
  switch (log.type) {
    case "info":
      console.log(chalk.blue(`[INFO] ${log.message}`));
      break;
    case "warn":
      console.warn(chalk.yellow(`[WARN] ${log.message}`));
      break;
    case "error":
      console.error(chalk.red(`[ERROR] ${log.message}`));
      break;
    case "codeRunError":
      console.error(chalk.red.bold(`[CODE_RUN_ERROR] ${log.error}`));
      break;
    case "success":
      console.log(chalk.green(`[SUCCESS] ${log.message}`));
      break;
    case "highlight":
      console.log(chalk.magenta(`[HIGHLIGHT] ${log.message}`));
      break;
    case "llmResponse":
      console.log(chalk.cyan(`[LLM_RESPONSE] ${log.content}`));
      break;
    case "codeState":
      console.log(chalk.gray(`[CODE_STATE] ${log.codeState.type}`));
      break;
    default:
      throw log satisfies never;
  }
}

export class StateExecution {
  public nextState: State;
  public durationMs?: number;
  private logs: TimestampedLogEntry[] = [];
  private conversationMessages: Message[] = [];
  public llmMetricsList: LlmMetrics[] = [];

  constructor(
    public readonly stateExecutionId: number,
    public readonly state: State,
    public codeState: CodeState,
    public readonly stateManager: StateManager,
    private readonly startTime: number = Date.now()
  ) {
    this.nextState = state;
    this.logCodeState(codeState);
  }

  log(log: LogEntry): void {
    this.logs.push({ timestamp: new Date(), entry: log });
    displayLog(log);
  }

  addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  updateCodeState(codeState: CodeState): void {
    this.codeState = codeState;
    this.logCodeState(codeState);
  }

  updateLlmMetrics(metrics: LlmMetrics): void {
    this.llmMetricsList.push(metrics);
  }

  updateNextState(nextState: State): void {
    this.nextState = nextState;
  }

  complete() {
    this.durationMs = Date.now() - this.startTime;
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  criticalError(error: string) {
    this.log({ type: "error", message: error });
    this.updateNextState(State.CRITICAL_ERROR);
  }

  logCodeState(codeState: CodeState) {
    return this.log({ type: "codeState", codeState });
  }
}
