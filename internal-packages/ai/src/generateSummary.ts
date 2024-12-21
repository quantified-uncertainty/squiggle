import { Artifact, ArtifactKind } from "./Artifact.js";
import { Code } from "./Code.js";
import { calculatePriceMultipleCalls } from "./LLMClient/index.js";
import { IOShape } from "./LLMStepTemplate.js";
import { getLogEntryFullName, TimestampedLogEntry } from "./Logger.js";
import { Workflow } from "./workflows/Workflow.js";

export function generateSummary<Shape extends IOShape>(
  workflow: Workflow<Shape>
): string {
  let summary = "";

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

function generateOverview<Shape extends IOShape>(
  workflow: Workflow<Shape>
): string {
  const steps = workflow.getSteps();
  const metricsByLLM = workflow.llmMetricSummary();

  const totalTime = steps.reduce((acc, exec) => acc + exec.getDuration(), 0);
  const estimatedCost = calculatePriceMultipleCalls(metricsByLLM);

  let overview = `- Total Steps: ${steps.length}\n`;
  overview += `- Total Time: ${(totalTime / 1000).toFixed(2)} seconds\n`;

  for (const [llmId, metrics] of Object.entries(metricsByLLM)) {
    overview += `- ${llmId}:\n`;
    overview += `  - API Calls: ${metrics.apiCalls}\n`;
    overview += `  - Input Tokens: ${metrics.inputTokens}\n`;
    overview += `  - Output Tokens: ${metrics.outputTokens}\n`;
  }

  overview += `- Estimated Total Cost: $${estimatedCost.toFixed(4)}\n`;

  return overview;
}

function generateErrorSummary<Shape extends IOShape>(
  workflow: Workflow<Shape>
): string {
  const steps = workflow.getSteps();

  let errorSummary = "";

  steps.forEach((step, index) => {
    const errors = step.getLogs().filter((log) => log.entry.type === "error");
    if (errors.length > 0) {
      errorSummary += `### ❌ Step ${index + 1} (${step.template.name})\n`;
      errors.forEach((error) => {
        if (error.entry.type === "error") {
          errorSummary += `- 🔴 ${error.entry.message}\n`;
        }
      });
    }
  });
  return errorSummary || "✅ No errors encountered.\n";
}

function generateDetailedStepLogs<Shape extends IOShape>(
  workflow: Workflow<Shape>
): string {
  let detailedLogs = "";
  const steps = workflow.getSteps();
  steps.forEach((step, index) => {
    const totalCost = step.getTotalCost();

    detailedLogs += `\n## 🔄 Step ${index + 1} - ${step.template.name} (Cost: $${totalCost.toFixed(4)})\n`;
    detailedLogs += `- ⏱️ Duration: ${step.getDuration() / 1000} seconds\n`;

    step.llmMetricsList.forEach((metrics) => {
      const cost = calculatePriceMultipleCalls({ [metrics.llmId]: metrics });
      detailedLogs += `- ${metrics.llmId}:\n`;
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

    {
      const state = step.getState();
      if (state.kind === "DONE") {
        detailedLogs += "### Outputs:\n";
        for (const [key, artifact] of Object.entries(state.outputs)) {
          if (!artifact) continue;
          detailedLogs += getFullArtifact(key, artifact);
        }
      }
    }

    detailedLogs += "### Logs:\n";
    if (step.getLogs().length === 0) {
      detailedLogs +=
        "⚠️ Logs are only available during the active session. They are not persisted and will be cleared after refreshing the page.\n";
    }
    step.getLogs().forEach((log) => {
      detailedLogs += `#### **${getLogEntryFullName(log.entry)}:**\n`;
      detailedLogs += getFullMessage(log) + "\n";
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
    case "llmResponse": {
      const llmResponse = log.entry;
      return `##### Content

\`\`\`\`
${llmResponse.content}
\`\`\`\`

##### Prompt

\`\`\`\`
${llmResponse.prompt}
\`\`\`\`

##### Messages

\`\`\`\`json
${JSON.stringify(llmResponse.messages, null, 2)}
\`\`\`\`

##### Full Response

\`\`\`\`json
${JSON.stringify(llmResponse.response, null, 2)}
\`\`\`\`
`;
    }
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
      return `🔴 Code Update: [Error] - Formatting failed

**Error:**
\`\`\`
${code.error}
\`\`\`

**Code:**
\`\`\`squiggleEditor
${code.source}
\`\`\`

`;
    case "runFailed":
      return `🔴 Code Update: [Error] - Run failed

**Error:**
\`\`\`
${code.error}
\`\`\`

**Code:**
\`\`\`squiggleEditor
${code.source}
\`\`\`
`;
    case "success":
      return `✅ Code Update: [Success] - Code executed successfully

\`\`\`squiggleEditor
${code.source}
\`\`\`
`;
  }
}
