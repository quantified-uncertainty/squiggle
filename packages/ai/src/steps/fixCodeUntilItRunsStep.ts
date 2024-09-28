import { Code, codeErrorString } from "../Code.js";
import { LLMStepTemplate } from "../LLMStepTemplate.js";
import { changeFormatPrompt, PromptPair } from "../prompts.js";
import { diffCompletionContentToCode } from "../squiggle/processSquiggleCode.js";
import { addLineNumbers } from "../squiggle/searchReplace.js";
import { getSquiggleWarningsAsString } from "../squiggle/squiggleCodeWarnings.js";
import { getSquiggleErrorSuggestions } from "../squiggle/squiggleErrorSuggestions.js";

export function getSquiggleAdvice(errorMessage: string, code: string): string {
  const errorAdvice = getSquiggleErrorSuggestions(errorMessage);
  const warningsAdvice = getSquiggleWarningsAsString(code);

  const sections = [];

  if (errorAdvice) {
    sections.push("## Error Information\n\n" + errorAdvice);
  }

  if (warningsAdvice) {
    sections.push("## Code Warnings\n\n" + warningsAdvice);
  }

  return sections.length > 0
    ? sections.join("\n\n")
    : "No errors or warnings found.";
}

function editExistingSquiggleCodePrompt(code: Code): PromptPair {
  const error = codeErrorString(code);
  const advice = getSquiggleAdvice(error, code.source);
  const fullPrompt = `You are an expert Squiggle code debugger. Your task is solely to fix an error in the given Squiggle code.
Follow these steps:

1. Analyze the Code and Error Message: Carefully review the original code, the error message, and any provided advice.
2. Maintain Code Integrity: Fix the error while preserving the original code structure and functionality. Avoid unrelated changes.
3. Choose the Most Efficient Fix: If multiple solutions exist, implement the most straightforward and effective one.
4. Avoid Repetition of Past Mistakes: Review previous attempts (if any) and do not repeat the same errors.

<original_code_with_line_numbers>
${addLineNumbers(code.source)}
</original_code_with_line_numbers>

<error_message>
${error}
</error_message>

<advice>
${advice || "No specific advice provided."}
</advice>

${changeFormatPrompt}
`;

  const summarizedPrompt = `Debug Squiggle code.
 
**Error:**
${error.substring(0, 300)}${error.length > 300 ? "..." : ""}.
  
Fix the error while maintaining code structure and efficiency.`;

  return { fullPrompt, summarizedPrompt };
}

export const fixCodeUntilItRunsStep = new LLMStepTemplate(
  "FixCodeUntilItRuns",
  {
    inputs: {
      code: "code",
    },
    outputs: { code: "code" },
  },
  async (context, { code }) => {
    const promptPair = editExistingSquiggleCodePrompt(code.value);

    const completion = await context.queryLLM(promptPair);
    if (completion) {
      const newCodeResult = await diffCompletionContentToCode(
        completion,
        code.value
      );
      if (newCodeResult.ok) {
        context.setOutput("code", newCodeResult.value);
      } else {
        context.fail("MINOR", newCodeResult.value);
      }
    }
  }
);
