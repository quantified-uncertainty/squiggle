import chalk from "chalk";

import { Message } from "./LLMClient.js";

export type LogEntry =
  | InfoLogEntry
  | WarnLogEntry
  | ErrorLogEntry
  | CodeRunErrorLogEntry
  | SuccessLogEntry
  | HighlightLogEntry
  | LlmResponseLogEntry;

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
    default:
      return `❓ Unknown (${entry satisfies never})`;
  }
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
      break;
    default:
      throw log satisfies never;
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

export class Logger {
  logs: TimestampedLogEntry[] = [];

  log(log: LogEntry): void {
    this.logs.push({ timestamp: new Date(), entry: log });
    displayLog(log);
  }
}
