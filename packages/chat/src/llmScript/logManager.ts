// logManager.ts

export enum LogLevel {
  INFO,
  WARN,
  ERROR,
  SUCCESS,
  HIGHLIGHT,
}

export interface LogEntry {
  message: string;
  timestamp: Date;
  level: LogLevel;
  executionId: number;
}

export class LogManager {
  private logs: LogEntry[] = [];
  private currentExecutionId: number = 0;

  startNewExecution(): number {
    return ++this.currentExecutionId;
  }

  log(message: string, level: LogLevel): void {
    this.logs.push({
      message,
      timestamp: new Date(),
      level,
      executionId: this.currentExecutionId,
    });
    console.log(this.logs.at(-1));
  }

  getLogs(executionId?: number): LogEntry[] {
    if (executionId !== undefined) {
      return this.logs.filter((log) => log.executionId === executionId);
    }
    return this.logs;
  }

  getLatestLogs(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }
}
