import fs from "fs";
import path from "path";

import { Artifact } from "./Artifact";
import { calculatePriceMultipleCalls, LlmMetrics, LLMName } from "./LLMClient";
import { CodeState, LLMStepInstance } from "./LLMStep";
import { getLogEntryFullName, TimestampedLogEntry } from "./Logger";
import { Workflow } from "./Workflow";

export function generateSummary(prompt: string, workflow: Workflow): string {
  let summary = "";
  const executions = workflow.getSteps();
  const metricsByLLM = workflow.llmMetricSummary();

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
}

function generateOverview(
  executions: LLMStepInstance[],
  metricsByLLM: Record<string, LlmMetrics>
): string {
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
}

function generateErrorSummary(steps: LLMStepInstance[]): string {
  let errorSummary = "";
  steps.forEach((step, index) => {
    const errors = step
      .getLogs()
      .filter(
        (log) => log.entry.type === "error" || log.entry.type === "codeRunError"
      );
    if (errors.length > 0) {
      errorSummary += `### ❌ Execution ${index + 1} (${step.template.name})\n`;
      errors.forEach((error) => {
        if (error.entry.type === "error") {
          errorSummary += `- 🔴 ${error.entry.message}\n`;
        } else if (error.entry.type === "codeRunError") {
          errorSummary += `- 🔴 ${error.entry.error}\n`;
        }
      });
    }
  });
  return errorSummary || "✅ No errors encountered.\n";
}

function generateDetailedExecutionLogs(steps: LLMStepInstance[]): string {
  let detailedLogs = "";
  steps.forEach((step, index) => {
    const totalCost = calculatePriceMultipleCalls(
      step.llmMetricsList.reduce(
        (acc, metrics) => {
          acc[metrics.llmName] = metrics;
          return acc;
        },
        {} as Record<LLMName, LlmMetrics>
      )
    );

    detailedLogs += `\n## 🔄 Execution ${index + 1} - ${step.template.name} (Cost: $${totalCost.toFixed(4)})\n`;
    detailedLogs += `- ⏱️ Duration: ${(step.durationMs || 0) / 1000} seconds\n`;

    step.llmMetricsList.forEach((metrics) => {
      const cost = calculatePriceMultipleCalls({ [metrics.llmName]: metrics });
      detailedLogs += `- ${metrics.llmName}:\n`;
      detailedLogs += `  - API Calls: ${metrics.apiCalls}\n`;
      detailedLogs += `  - Input Tokens: ${metrics.inputTokens}\n`;
      detailedLogs += `  - Output Tokens: ${metrics.outputTokens}\n`;
      detailedLogs += `  - Estimated Cost: $${cost.toFixed(4)}\n`;
      detailedLogs += `  - Output tokens per second: ${(metrics.outputTokens / ((step.durationMs ?? 0) / 1000)).toFixed(2)}\n`;
    });

    detailedLogs += "### Inputs:\n";
    for (const [key, artifact] of Object.entries(step.getInputs())) {
      detailedLogs += `#### ${key}\n`;
      detailedLogs += getFullArtifact(artifact);
    }

    detailedLogs += "### Outputs:\n";
    for (const [key, artifact] of Object.entries(step.getAllOutputs())) {
      if (!artifact) continue;
      detailedLogs += `#### ${key}\n`;
      detailedLogs += getFullArtifact(artifact);
    }

    detailedLogs += "### Logs:\n";
    step.getLogs().forEach((log) => {
      detailedLogs += `#### **${getLogEntryFullName(log.entry)}:**\n`;
      detailedLogs += `${getFullMessage(log)}`;
    });
  });
  return detailedLogs;
}

function getFullMessage(log: TimestampedLogEntry): string {
  switch (log.entry.type) {
    case "info":
    case "warn":
    case "error":
    case "success":
    case "highlight":
      return log.entry.message;
    case "codeRunError":
      return log.entry.error;
    case "llmResponse":
      const llmResponse = log.entry;
      return `<details>
  <summary>Content</summary>

\`\`\`\`
${llmResponse.content}
\`\`\`\`
</details>\n\n

<details>
  <summary>Prompt</summary>

\`\`\`\`
${llmResponse.prompt}
\`\`\`\`
</details>\n\n


<details>
  <summary>Messages</summary>

\`\`\`\`json
${JSON.stringify(llmResponse.messages, null, 2)}
\`\`\`\`
</details>\n\n

<details>
  <summary>Full Response</summary>

\`\`\`\`json
${JSON.stringify(llmResponse.response, null, 2)}
\`\`\`\`
</details>\n\n\n`;
    default:
      return "❓ Unknown log type";
  }
}

function getFullArtifact(artifact: Artifact) {
  switch (artifact.kind) {
    case "prompt":
      return `ℹ️ Prompt
\`\`\`
${artifact.value}
\`\`\`
`;
    case "code":
      return `📄️ Code
\`\`\`
${artifact.value}
\`\`\`
`;
    case "codeState":
      return `📄️ Code State
${formatCodeState(artifact.value)}
`;
    default:
      return `❓ Unknown (${artifact satisfies never})`;
  }
}

function formatCodeState(codeState: CodeState): string {
  switch (codeState.type) {
    case "formattingFailed":
      return `<details>
  <summary>🔴 Code Update: [Error] - Formatting failed</summary>

**Error:**
\`\`\`
${codeState.error}
\`\`\`

**Code:**
\`\`\`squiggleEditor
${codeState.code}
\`\`\`
</details>\n\n`;
    case "runFailed":
      return `<details>
  <summary>🔴 Code Update: [Error] - Run failed</summary>

**Error:**
\`\`\`
${codeState.error.toStringWithDetails()}
\`\`\`

**Code:**
\`\`\`squiggleEditor
${codeState.code}
\`\`\`
</details>\n\n`;
    case "success":
      return `<details>
  <summary>✅ Code Update: [Success] - Code executed successfully</summary>

\`\`\`squiggleEditor
${codeState.code}
\`\`\`
</details>\n\n`;
  }
}

export function saveSummaryToFile(summary: string): void {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const logFile = path.join(logDir, `squiggle_summary_${timestamp}.md`);

  fs.writeFileSync(logFile, summary);
  console.log(`Summary saved to ${logFile}`);
}
