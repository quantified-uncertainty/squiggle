import fs from "fs";
import path from "path";

import { Artifact, ArtifactKind } from "./Artifact.js";
import { Code } from "./CodeState.js";
import { calculatePriceMultipleCalls } from "./LLMClient.js";
import { getLogEntryFullName, TimestampedLogEntry } from "./Logger.js";
import { Workflow } from "./Workflow.js";

export function generateSummary(prompt: string, workflow: Workflow): string {
  let summary = "";
  const steps = workflow.getSteps();

  // Prompt
  summary += "# 🔮 PROMPT\n";
  summary += `${prompt}\n\n`;

  // Overview
  summary += "# 📊 SUMMARY OVERVIEW\n";
  summary += generateOverview(workflow);

  // Error Summary
  summary += "# 🚨 ERROR SUMMARY\n";
  summary += generateErrorSummary(workflow);

  // Detailed Step Summaries
  summary += "# 🔍 DETAILED STEP LOGS\n";
  summary += generateDetailedStepLogs(workflow);

  return summary;
}

function generateOverview(workflow: Workflow): string {
  const steps = workflow.getSteps();
  const metricsByLLM = workflow.llmMetricSummary();

  const totalTime = steps.reduce((acc, exec) => acc + exec.getDuration(), 0);
  const estimatedCost = calculatePriceMultipleCalls(metricsByLLM);

  let overview = `- Total Steps: ${steps.length}\n`;
  overview += `- Total Time: ${(totalTime / 1000).toFixed(2)} seconds\n`;

  for (const [llmName, metrics] of Object.entries(metricsByLLM)) {
    overview += `- ${llmName}:\n`;
    overview += `  - API Calls: ${metrics.apiCalls}\n`;
    overview += `  - Input Tokens: ${metrics.inputTokens}\n`;
    overview += `  - Output Tokens: ${metrics.outputTokens}\n`;
  }

  overview += `- Estimated Total Cost: $${estimatedCost.toFixed(4)}\n`;

  return overview;
}

function generateErrorSummary(workflow: Workflow): string {
  const steps = workflow.getSteps();

  let errorSummary = "";

  steps.forEach((step, index) => {
    const errors = step
      .getLogs()
      .filter(
        (log) => log.entry.type === "error" || log.entry.type === "codeRunError"
      );
    if (errors.length > 0) {
      errorSummary += `### ❌ Step ${index + 1} (${step.template.name})\n`;
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

function generateDetailedStepLogs(workflow: Workflow): string {
  let detailedLogs = "";
  const steps = workflow.getSteps();
  steps.forEach((step, index) => {
    const totalCost = step.getTotalCost();

    detailedLogs += `\n## 🔄 Step ${index + 1} - ${step.template.name} (Cost: $${totalCost.toFixed(4)})\n`;
    detailedLogs += `- ⏱️ Duration: ${step.getDuration() / 1000} seconds\n`;

    step.llmMetricsList.forEach((metrics) => {
      const cost = calculatePriceMultipleCalls({ [metrics.llmName]: metrics });
      detailedLogs += `- ${metrics.llmName}:\n`;
      detailedLogs += `  - API Calls: ${metrics.apiCalls}\n`;
      detailedLogs += `  - Input Tokens: ${metrics.inputTokens}\n`;
      detailedLogs += `  - Output Tokens: ${metrics.outputTokens}\n`;
      detailedLogs += `  - Estimated Cost: $${cost.toFixed(4)}\n`;
      detailedLogs += `  - Output tokens per second: ${(metrics.outputTokens / (step.getDuration() / 1000)).toFixed(2)}\n`;
    });

    detailedLogs += "### Inputs:\n";
    for (const [key, artifact] of Object.entries(step.getInputs())) {
      detailedLogs += getFullArtifact(key, artifact);
    }

    detailedLogs += "### Outputs:\n";
    for (const [key, artifact] of Object.entries(step.getOutputs())) {
      if (!artifact) continue;
      detailedLogs += getFullArtifact(key, artifact);
    }

    detailedLogs += "### Logs:\n";
    step.getLogs().forEach((log) => {
      detailedLogs += `#### **${getLogEntryFullName(log.entry)}:**\n`;
      detailedLogs += getFullMessage(log);
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

function getFullArtifact(name: string, artifact: Artifact) {
  const kindToEmoji: Record<ArtifactKind, string> = {
    prompt: "✏️",
    source: "📄️",
    code: "🔧",
  };

  const header = `#### ${name} ${kindToEmoji[artifact.kind] ?? "❓"}`;

  switch (artifact.kind) {
    case "prompt":
      return `${header}
\`\`\`
${artifact.value}
\`\`\`
`;
    case "source":
      return `${header}
\`\`\`
${artifact.value}
\`\`\`
`;
    case "code":
      return `${header}
${formatCode(artifact.value)}
`;
    default:
      return `❓ Unknown (${artifact satisfies never})`;
  }
}

function formatCode(code: Code): string {
  switch (code.type) {
    case "formattingFailed":
      return `<details>
  <summary>🔴 Code Update: [Error] - Formatting failed</summary>

**Error:**
\`\`\`
${code.error}
\`\`\`

**Code:**
\`\`\`squiggleEditor
${code.source}
\`\`\`
</details>\n\n`;
    case "runFailed":
      return `<details>
  <summary>🔴 Code Update: [Error] - Run failed</summary>

**Error:**
\`\`\`
${code.error.toStringWithDetails()}
\`\`\`

**Code:**
\`\`\`squiggleEditor
${code.source}
\`\`\`
</details>\n\n`;
    case "success":
      return `<details>
  <summary>✅ Code Update: [Success] - Code executed successfully</summary>

\`\`\`squiggleEditor
${code.source}
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
