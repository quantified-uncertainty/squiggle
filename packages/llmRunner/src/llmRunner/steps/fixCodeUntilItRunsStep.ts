import { CodeState, codeStateErrorString } from "../CodeState";
import { getSquiggleAdvice } from "../getSquiggleAdvice";
import { LLMStepTemplate } from "../LLMStep";
import { diffCompletionContentToCodeState } from "../processSquiggleCode";
import { changeFormatPrompt, PromptPair } from "../prompts";

function editExistingSquiggleCodePrompt(codeState: CodeState): PromptPair {
  const error = codeStateErrorString(codeState);
  const advice = getSquiggleAdvice(error, codeState.code);
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
${codeState.code}
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
      prompt: "prompt",
      codeState: "codeState",
    },
    outputs: { codeState: "codeState" },
  },
  async (context, { prompt, codeState }) => {
    const promptPair = editExistingSquiggleCodePrompt(codeState.value);

    const completion = await context.queryLLM(promptPair);
    if (completion) {
      const nextState = await diffCompletionContentToCodeState(
        completion,
        codeState.value
      );
      if (nextState.ok) {
        context.setOutput("codeState", {
          kind: "codeState",
          value: nextState.value,
        });
      } else {
        context.log({
          type: "codeRunError",
          error: nextState.value,
        });
      }
    }
  }
);
