import fs from "fs";
import path from "path";

import { calculatePriceMultipleCalls, LlmMetrics } from "./llmHelper";
import {
  CodeRunErrorLogEntry,
  CodeState,
  CodeStateLogEntry,
  ErrorLogEntry,
  HighlightLogEntry,
  InfoLogEntry,
  LlmResponseLogEntry,
  State,
  StateExecution,
  StateManager,
  SuccessLogEntry,
  TimestampedLogEntry,
  WarnLogEntry,
} from "./stateManager";

const escapeMarkdown = (text: string): string => {
  return text.replace(/```/g, "\\`\\`\\`");
};

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

const generateOverview = (
  executions: StateExecution[],
  metricsByLLM: Record<string, LlmMetrics>
): string => {
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

  overview += `- Estimated Total Cost: $${estimatedCost.toFixed(4)}\n`;

  return overview;
};

const generateErrorSummary = (executions: StateExecution[]): string => {
  let errorSummary = "";
  executions.forEach((execution, index) => {
    const errors = execution
      .getLogs()
      .filter(
        (log): log is TimestampedLogEntry =>
          log.entry.type === "error" || log.entry.type === "codeRunError"
      );
    if (errors.length > 0) {
      errorSummary += `### Execution ${index + 1} (${State[execution.state]})\n`;
      errors.forEach((error) => {
        if (error.entry.type === "error") {
          errorSummary += `- ${error.entry.message}\n`;
        } else if (error.entry.type === "codeRunError") {
          errorSummary += `- ${error.entry.error}\n`;
        }
      });
    }
  });
  return errorSummary || "No errors encountered.\n";
};

const generateDetailedExecutionLogs = (
  executions: StateExecution[]
): string => {
  let detailedLogs = "";
  executions.forEach((execution, index) => {
    const totalCost = calculatePriceMultipleCalls(
      execution.llmMetricsList.reduce((acc, metrics) => {
        acc[metrics.llmName] = metrics;
        return acc;
      }, {})
    );

    detailedLogs += `## Execution ${index + 1} - ${State[execution.state]} (Cost: $${totalCost.toFixed(4)})\n`;
    detailedLogs += `- Duration: ${(execution.durationMs || 0) / 1000} seconds\n`;

    execution.llmMetricsList.forEach((metrics) => {
      const cost = calculatePriceMultipleCalls({ [metrics.llmName]: metrics });
      detailedLogs += `- ${metrics.llmName}:\n`;
      detailedLogs += `  - API Calls: ${metrics.apiCalls}\n`;
      detailedLogs += `  - Input Tokens: ${metrics.inputTokens}\n`;
      detailedLogs += `  - Output Tokens: ${metrics.outputTokens}\n`;
      detailedLogs += `  - Estimated Cost: $${cost.toFixed(4)}\n`;
    });

    detailedLogs += "### Logs:\n";
    execution.getLogs().forEach((log) => {
      detailedLogs += `#### **${log.entry.type.toUpperCase()}:**\n`;
      detailedLogs += `${getFullMessage(log)}`;
    });
    detailedLogs += "<details><summary>Code At End</summary>\n\n";
    detailedLogs += formatCodeState(execution.codeState);
    detailedLogs += "\n</details>\n\n";
  });
  return detailedLogs;
};

const getFullMessage = (log: TimestampedLogEntry): string => {
  switch (log.entry.type) {
    case "info":
    case "warn":
    case "error":
    case "success":
    case "highlight":
      return (
        log.entry as
          | InfoLogEntry
          | WarnLogEntry
          | ErrorLogEntry
          | SuccessLogEntry
          | HighlightLogEntry
      ).message;
    case "codeRunError":
      return `Error: ${(log.entry as CodeRunErrorLogEntry).error}`;
    case "llmResponse":
      const llmResponse = log.entry as LlmResponseLogEntry;
      return `LLM Response:
<details>
  <summary>Content</summary>

\`\`\`
${escapeMarkdown(llmResponse.content)}
\`\`\`
</details>

<details>
  <summary>Messages</summary>

\`\`\`json
${escapeMarkdown(JSON.stringify(llmResponse.messages, null, 2))}
\`\`\`
</details>

<details>
  <summary>Full Response</summary>

\`\`\`json
${escapeMarkdown(JSON.stringify(llmResponse.response, null, 2))}
\`\`\`
</details>\n`;
    case "codeState":
      const codeState = (log.entry as CodeStateLogEntry).codeState;
      switch (codeState.type) {
        case "noCode":
          return "Code state: No code generated";
        case "formattingFailed":
          return `Code state: Formatting failed
Error: ${codeState.error}
Code:
${codeState.code}`;
        case "runFailed":
          return `Code state: Run failed
Error: ${codeState.error}
Code:
${codeState.code}`;
        case "success":
          return `Code state: Success
Code:
${codeState.code}`;
      }
    default:
      return "Unknown log type";
  }
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
  prompt: string,
  stateManager: StateManager
): void => {
  const summary = generateSummary(prompt, stateManager);
  saveSummaryToFile(summary);
};
