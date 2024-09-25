import { Code, codeErrorString } from "../Code.js";
import { LLMStepTemplate } from "../LLMStep.js";
import { changeFormatPrompt, PromptPair } from "../prompts.js";
import { getSquiggleAdvice } from "../squiggle/getSquiggleAdvice.js";
import { diffCompletionContentToCode } from "../squiggle/processSquiggleCode.js";

function addLineNumbers(code: string): string {
  return code
    .split("\n")
    .map((line, index) => `${(index + 1).toString().padStart(3, "0")}:${line}`)
    .join("\n");
}

function editExistingSquiggleCodePrompt(code: Code): PromptPair {
  const error = codeErrorString(code);
  const advice = getSquiggleAdvice(error, code.source);
  const fullPrompt = `You are an expert Squiggle code debugger. Your task is solely to fix an error in the given Squiggle code. Follow these steps:

1. Carefully analyze the original code and the error message.
2. Consider the provided advice, if any.
3. Maintain the original code structure where possible.
4. Focus solely on fixing the error; avoid unrelated changes.
5. If multiple solutions exist, choose the most efficient one.
6. Explain the root cause of the error and your fix in a brief comment within the code.
7. Ensure the new code is a standalone model that can replace the original entirely.
8. Do not include explanations or comments outside the SEARCH/REPLACE blocks.
9. Look through the previous attempts at fixing the error. Do not repeat the same mistakes.
10. Use the smallest possible SEARCH/REPLACE blocks. If you only want to change one line, use a block with just that line.

Original code:
<original_code>
${addLineNumbers(code.source)}
</original_code>

Error message:
<error_message>
${error}
</error_message>

Advice:
<advice>
${advice || "No specific advice provided."}
</advice>

${changeFormatPrompt}
`;

  const summarizedPrompt = `Debug Squiggle code. Error: ${error.substring(0, 300)}${error.length > 300 ? "..." : ""}. Fix the error while maintaining code structure and efficiency.`;

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
        context.log({
          type: "codeRunError",
          error: newCodeResult.value,
        });
      }
    }
  }
);
