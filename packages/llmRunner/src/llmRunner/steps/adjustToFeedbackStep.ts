import { Code, codeStringToCode } from "../CodeState";
import { LLMStepTemplate } from "../LLMStep";
import { diffToNewCode } from "../processSquiggleCode";
import { changeFormatPrompt, PromptPair } from "../prompts";

function adjustToFeedbackPrompt(
  prompt: string,
  code: Extract<Code, { type: "success" }>
): PromptPair {
  const fullPrompt = `You are an expert Squiggle code reviewer. Your task is to review and potentially improve Squiggle code based on the given prompt and previous output.

Original prompt:
<original_code>
${prompt}
</original_code>

Current code:
<current_code>
${code.source}
</current_code>

Review the code and output. Consider these criteria:
1. Does the code match the prompt? Does it need to be longer or shorter? Does it include the right components? When in doubt between the prompt and other criteria, follow the prompt.
2. Use descriptive variable names (e.g., "human_lifespan" instead of "hl").
3. Include a brief summary comment at the top (use // for one line, /* ... */ for multiple lines).
4. Add appropriate @name, @doc, @format, and other tags. Use @name and @doc where variable names aren't easily understood. @name is preffered to @doc, but if there's a lot of key information to add, use @doc as well. 
5. Check for unexpected results or failing tests.
6. Add additional tests (using sTest) for uncovered failure points.
7. Handle edge cases and implement error handling where necessary.
8. Remove any comments that are not necessary - for example, ones explaining previous code changes.
9. Look through the previous attempts at fixing the error. Do not repeat the same mistakes.

If no adjustments are needed (this should be the common response), respond with:
<response>
NO_ADJUSTMENT_NEEDED
</response>

If adjustments are strongly needed, provide the full adjusted code and a brief explanation:

${changeFormatPrompt}

Aim for concise, effective code that meets all requirements and handles edge cases. Pay special attention to any important errors in the variables or result, and recommend changes if you notice any. However, there should be a fairly low bar for responding with NO_ADJUSTMENT_NEEDED. If you do recommend changes, provide your best recommendation, all things considered.

Focus on improving clarity, efficiency, and adherence to requirements. Only recommend changes for substantial improvements or to fix important issues.

Previous output:
<previous_output>
Variables: "${code.result.bindings}"
Result: "${code.result.result}"
</previous_output>
`;

  const summarizedPrompt = `Review and potentially improve Squiggle code for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Consider variable names, comments, tags, tests, and edge cases.`;

  return { fullPrompt, summarizedPrompt };
}

export const adjustToFeedbackStep = new LLMStepTemplate(
  "AdjustToFeedback",
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
      adjustToFeedbackPrompt(prompt.value, code.value)
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
