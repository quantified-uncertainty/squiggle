import fs from "fs";
import path from "path";

import { calculatePrice, SELECTED_MODEL } from "./llmConfig";
import { CodeState, LogLevel, State, StateManager } from "./stateManager";

const generateSummary = (
  prompt: string,
  stateManager: StateManager
): string => {
  let summary = "";
  const executions = stateManager.getStateExecutions();
  const metrics = stateManager.getAllMetrics();

  // Prompt
  summary += "# 🔮 PROMPT\n";
  summary += `${prompt}\n\n`;

  // Overview
  summary += "# 📊 SUMMARY OVERVIEW\n";
  summary += generateOverview(executions, metrics);

  // Error Summary
  summary += "# 🚨 ERROR SUMMARY\n";
  summary += generateErrorSummary(executions);

  // Detailed Execution Summaries
  summary += "# 🔍 DETAILED EXECUTION LOGS\n";
  summary += generateDetailedExecutionLogs(executions);

  return summary;
};

const generateOverview = (executions, metrics) => {
  const totalTime = executions.reduce(
    (acc, exec) => acc + (exec.durationMs || 0),
    0
  );
  const estimatedCost = calculatePrice(
    metrics.inputTokens,
    metrics.outputTokens
  );

  return `- Total Executions: ${executions.length}
- Total Time: ${(totalTime / 1000).toFixed(2)} seconds
- Total API Calls: ${metrics.apiCalls}
- Total Input Tokens: ${metrics.inputTokens}
- Total Output Tokens: ${metrics.outputTokens}
- Estimated Cost: $${estimatedCost.toFixed(6)} (${SELECTED_MODEL})\n`;
};

const generateErrorSummary = (executions) => {
  let errorSummary = "";
  executions.forEach((execution, index) => {
    const errors = execution
      .getLogs()
      .filter(
        (log) =>
          log.level === LogLevel.ERROR || log.level === LogLevel.CODE_RUN_ERROR
      );
    if (errors.length > 0) {
      errorSummary += `## Execution ${index + 1} (${State[execution.state]})\n`;
      errors.forEach((error) => {
        errorSummary += `- ${error.message}\n`;
      });
    }
  });
  return errorSummary || "No errors encountered.\n";
};

const generateDetailedExecutionLogs = (executions) => {
  let detailedLogs = "";
  executions.forEach((execution, index) => {
    detailedLogs += `## Execution ${index + 1} - ${State[execution.state]} - $${calculatePrice(execution.llmMetrics.inputTokens, execution.llmMetrics.outputTokens)}\n`;
    detailedLogs += `- Duration: ${(execution.durationMs || 0) / 1000} seconds\n`;
    detailedLogs += `- API Calls: ${execution.llmMetrics.apiCalls}\n`;
    detailedLogs += `- Input Tokens: ${execution.llmMetrics.inputTokens}\n`;
    detailedLogs += `- Output Tokens: ${execution.llmMetrics.outputTokens}\n`;
    detailedLogs += `- Input Costs: Input: $${calculatePrice(execution.llmMetrics.inputTokens, 0)}\n`;
    detailedLogs += `- Output Costs: Input: $${calculatePrice(0, execution.llmMetrics.outputTokens)}\n`;
    detailedLogs += "### Logs:\n";
    execution.getLogs().forEach((log) => {
      detailedLogs += `#### **${LogLevel[log.level]}:** \n ${log.message}\n\n`;
    });
    detailedLogs += "### Code:\n";
    detailedLogs += formatCodeState(execution.codeState);
    detailedLogs += "\n\n";
  });
  return detailedLogs;
};

const formatCodeState = (codeState: CodeState): string => {
  switch (codeState.type) {
    case "noCode":
      return "  No code generated\n";
    case "formattingFailed":
      return `**Formatting failed:**\n\`\`\`\n${codeState.error}\n\`\`\`\n**Code:**\n\`\`\`\n${codeState.code}\n\`\`\`\n`;
    case "runFailed":
      return `**Run failed:**\n\`\`\`\n${codeState.error}\n\`\`\`\n**Code:**\n\`\`\`\n${codeState.code}\n\`\`\`\n`;
    case "success":
      return `**Successful code:**\n\`\`\`\n${codeState.code}\n\`\`\`\n`;
  }
};

const saveSummaryToFile = (summary: string): void => {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const logFile = path.join(logDir, `squiggle_summary_${timestamp}.md`);

  fs.writeFileSync(logFile, summary);
  console.log(`Summary saved to ${logFile}`);
};

export const generateAndSaveSummary = (
  prompt,
  stateManager: StateManager
): void => {
  const summary = generateSummary(prompt, stateManager);
  saveSummaryToFile(summary);
};
