import { Code, codeStringToCode } from "../Code.js";
import { LLMStepTemplate } from "../LLMStepTemplate.js";
import { changeFormatPrompt, PromptPair } from "../prompts.js";
import { diffToNewCode } from "../squiggle/processSquiggleCode.js";

function matchStyleGuidePrompt(
  prompt: string,
  code: Extract<Code, { type: "success" }>
): PromptPair {
  const fullPrompt = `You are an expert Squiggle code reviewer. Your task is to review and potentially improve Squiggle code based on the given prompt and previous output.

<original_prompt>
${prompt}
</original_prompt>

<original_code>
${code.source}
</original_code>

<previous_output>
Variables: "${code.result.bindings}"
Result: "${code.result.result}"
</previous_output>

Please review the code and output and make sure it matches the attached style guide. Also, make sure it is fully compliant with the prompt.

If no adjustments are required (this should be the usual outcome), respond with:

<response>
NO_ADJUSTMENT_NEEDED
</response>

If significant adjustments are necessary, provide the fully adjusted code and a brief explanation (6-20 words).

Your goal is to ensure the code is effective and meets all requirements while addressing edge cases. Pay particular attention to errors in variable definitions or results, and suggest changes where needed. However, default to **NO_ADJUSTMENT_NEEDED** unless there is a strong reason for revision.

Focus on improving clarity, efficiency, and adherence to the requirements. Only recommend changes for meaningful improvements or fixing critical issues.

${changeFormatPrompt}
`;

  const summarizedPrompt = `Review and potentially improve Squiggle code for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Consider variable names, comments, tags, tests, and edge cases.`;

  return { fullPrompt, summarizedPrompt };
}

export const matchStyleGuideStep = new LLMStepTemplate(
  "MatchStyleGuide",
  {
    inputs: {
      prompt: "prompt",
      code: "code",
    },
    outputs: {
      code: "code",
    },
  },
  async (context, { prompt, code }) => {
    if (code.value.type !== "success") {
      throw new Error("Failed to process code in AdjustToFeedback stage");
    }

    const completion = await context.queryLLM(
      matchStyleGuidePrompt(prompt.value, code.value)
    );

    if (!completion) {
      // failed
      return;
    }

    // handle adjustment response
    const trimmedResponse = completion.trim();
    const noAdjustmentRegex =
      /no\s+adjust(?:ment)?\s+needed|NO_ADJUSTMENT_NEEDED/i;
    const isShortResponse = trimmedResponse.length <= 100;

    if (noAdjustmentRegex.test(trimmedResponse) && isShortResponse) {
      context.log({
        type: "info",
        message: "LLM determined no adjustment is needed",
      });
      return;
    }

    if (
      trimmedResponse.length > 0 &&
      !noAdjustmentRegex.test(trimmedResponse)
    ) {
      const diffResponse = diffToNewCode(completion, code.value);
      if (!diffResponse.ok) {
        context.log({
          type: "error",
          message: "FAIL: " + diffResponse.value,
        });
        // try again
        context.setOutput("code", code);
        return;
      }

      const adjustedCode = await codeStringToCode(diffResponse.value);
      context.setOutput("code", adjustedCode);
      return;
    } else {
      context.log({
        type: "info",
        message: "No adjustments provided, considering process complete",
      });
      return;
    }
  }
);
