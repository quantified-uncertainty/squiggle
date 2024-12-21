import chalk from "chalk";

import { Message } from "./LLMClient/types.js";

export type LogEntry =
  | InfoLogEntry
  | WarnLogEntry
  | ErrorLogEntry
  | SuccessLogEntry
  | HighlightLogEntry
  | LlmResponseLogEntry;

export type LoggerContext = {
  workflowId: string;
  stepIndex: number;
};

export function getLogEntryFullName(entry: LogEntry): string {
  switch (entry.type) {
    case "info":
      return "ℹ️ Information";
    case "warn":
      return "⚠️ Warning";
    case "error":
      return "🚫 System Error";
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

const logTypes = {
  info: { fn: console.log, color: chalk.white, maxLines: Infinity },
  warn: { fn: console.warn, color: chalk.yellow, maxLines: Infinity },
  error: { fn: console.error, color: chalk.red, maxLines: 5 },
  success: { fn: console.log, color: chalk.green, maxLines: Infinity },
  highlight: { fn: console.log, color: chalk.magenta, maxLines: Infinity },
  llmResponse: { fn: console.log, color: chalk.cyan, maxLines: 3 },
};

function displayLog(
  log: LogEntry,
  workflowId: string,
  stepIndex: number
): void {
  const prefix = chalk.gray(`[workflow:${workflowId}, step:${stepIndex}]`);
  const indent = "  "; // Two spaces for indentation

  function formatMessage(message: string, maxLines: number = Infinity): string {
    const lines = message.split("\n");
    const truncated = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      truncated.push("...");
    }
    return truncated
      .map((line, index) => (index === 0 ? line : indent + line))
      .join("\n");
  }

  function logWithColor(
    logFn: typeof console.log,
    type: string,
    color: (text: string) => string,
    message: string,
    maxLines: number = Infinity
  ) {
    logFn(
      `${prefix} ${chalk.gray(`[${color(type)}] ${formatMessage(message, maxLines)}`)}`
    );
  }

  const logType = logTypes[log.type as keyof typeof logTypes];
  if (logType) {
    const message = "message" in log ? log.message : log.content;
    logWithColor(
      logType.fn,
      log.type.toUpperCase(),
      logType.color,
      message,
      logType.maxLines
    );
  } else {
    console.log(`${prefix} Unknown log type: ${log.type}`);
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

  log(log: LogEntry, context: LoggerContext): void {
    this.logs.push({ timestamp: new Date(), entry: log });
    displayLog(log, context.workflowId, context.stepIndex);
  }
}
