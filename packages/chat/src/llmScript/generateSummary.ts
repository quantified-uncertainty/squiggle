import chalk from "chalk";
import fs from "fs";
import path from "path";

import { calculatePrice, SELECTED_MODEL } from "./llmConfig";
import { CodeState, LogLevel, State, StateManager } from "./stateManager";

const generateSummary = (stateManager: StateManager): string => {
  let summary = "";

  // High-level summary
  const totalTime = stateManager
    .getStateExecutions()
    .reduce((acc, exec) => acc + (exec.durationMs || 0), 0);
  const totalApiCalls = stateManager.getAllMetrics().apiCalls;
  const totalInputTokens = stateManager.getAllMetrics().inputTokens;
  const totalOutputTokens = stateManager.getAllMetrics().outputTokens;
  const estimatedCost = calculatePrice(totalInputTokens, totalOutputTokens);

  summary += chalk.blue.bold("📊 High-Level Summary:\n");
  summary += `Total Executions: ${stateManager.getStateExecutions().length}\n`;
  summary += `Total Time: ${(totalTime / 1000).toFixed(2)} seconds\n`;
  summary += `Total API Calls: ${totalApiCalls}\n`;
  summary += `Total Input Tokens: ${totalInputTokens}\n`;
  summary += `Total Output Tokens: ${totalOutputTokens}\n`;
  summary += `Estimated Cost: $${estimatedCost.toFixed(6)} (${SELECTED_MODEL})\n\n`;

  // Detailed execution summaries
  stateManager.getStateExecutions().forEach((execution, index) => {
    summary += chalk.cyan.bold(`Execution ${index + 1}:\n`);
    summary += `State: ${State[execution.state]}\n`;
    summary += `Duration: ${(execution.durationMs || 0) / 1000} seconds\n`;
    summary += `API Calls: ${execution.llmMetrics.apiCalls}\n`;
    summary += `Input Tokens: ${execution.llmMetrics.inputTokens}\n`;
    summary += `Output Tokens: ${execution.llmMetrics.outputTokens}\n`;
    summary += "Logs:\n";
    execution.getLogs().forEach((log) => {
      summary += `  [${LogLevel[log.level]}] ${log.message}\n`;
    });
    summary += "Code:\n";
    summary += formatCodeState(execution.codeState);
    summary += "\n\n";
  });

  return summary;
};

const formatCodeState = (codeState: CodeState): string => {
  switch (codeState.type) {
    case "noCode":
      return "  No code generated\n";
    case "formattingFailed":
      return chalk.red(
        `  Formatting failed:\n${codeState.error}\n  Code:\n${codeState.code}\n`
      );
    case "runFailed":
      return chalk.yellow(
        `  Run failed:\n${codeState.error}\n  Code:\n${codeState.code}\n`
      );
    case "success":
      return chalk.green(`  Successful code:\n${codeState.code}\n`);
  }
};

const saveSummaryToFile = (summary: string): void => {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const logFile = path.join(logDir, `squiggle_summary_${timestamp}.log`);

  fs.writeFileSync(logFile, stripAnsi(summary));
  console.log(chalk.green(`Summary saved to ${logFile}`));
};

const stripAnsi = (str: string): string => {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
};

export const generateAndSaveSummary = (stateManager: StateManager): void => {
  const summary = generateSummary(stateManager);
  console.log(summary);
  saveSummaryToFile(summary);
};
