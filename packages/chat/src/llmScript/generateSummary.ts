import fs from "fs";
import path from "path";

import { calculatePriceMultipleCalls } from "./llmHelper";
import { CodeState, LogLevel, State, StateManager } from "./stateManager";

const generateSummary = (
  prompt: string,
  stateManager: StateManager
): string => {
  let summary = "";
  const executions = stateManager.getStateExecutions();
  const metricsByLLM = stateManager.llmMetricSummary();

  // Prompt
  summary += "# 🔮 PROMPT\n";
  summary += `${prompt}\n\n`;

  // Overview
  summary += "# 📊 SUMMARY OVERVIEW\n";
  summary += generateOverview(executions, metricsByLLM);

  // Error Summary
  summary += "# 🚨 ERROR SUMMARY\n";
  summary += generateErrorSummary(executions);

  // Detailed Execution Summaries
  summary += "# 🔍 DETAILED EXECUTION LOGS\n";
  summary += generateDetailedExecutionLogs(executions);

  return summary;
};

const generateOverview = (executions, metricsByLLM) => {
  const totalTime = executions.reduce(
    (acc, exec) => acc + (exec.durationMs || 0),
    0
  );
  const estimatedCost = calculatePriceMultipleCalls(metricsByLLM);

  let overview = `- Total Executions: ${executions.length}\n`;
  overview += `- Total Time: ${(totalTime / 1000).toFixed(2)} seconds\n`;

  for (const llmName in metricsByLLM) {
    const metrics = metricsByLLM[llmName];
    overview += `- ${llmName}:\n`;
    overview += `  - API Calls: ${metrics.apiCalls}\n`;
    overview += `  - Input Tokens: ${metrics.inputTokens}\n`;
    overview += `  - Output Tokens: ${metrics.outputTokens}\n`;
  }

  overview += `- Estimated Total Cost: $${estimatedCost.toFixed(6)}\n`;

  return overview;
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
    detailedLogs += `## Execution ${index + 1} - ${State[execution.state]}\n`;
    detailedLogs += `- Duration: ${(execution.durationMs || 0) / 1000} seconds\n`;

    execution.llmMetricsList.forEach((metrics) => {
      const cost = calculatePriceMultipleCalls({ [metrics.llmName]: metrics });
      detailedLogs += `- ${metrics.llmName}:\n`;
      detailedLogs += `  - API Calls: ${metrics.apiCalls}\n`;
      detailedLogs += `  - Input Tokens: ${metrics.inputTokens}\n`;
      detailedLogs += `  - Output Tokens: ${metrics.outputTokens}\n`;
      detailedLogs += `  - Estimated Cost: $${cost.toFixed(6)}\n`;
    });

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
