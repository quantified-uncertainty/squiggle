import { Code, codeStringToCode } from "../Code.js";
import { LLMStepTemplate } from "../LLMStepTemplate.js";
import { changeFormatPrompt, PromptPair } from "../prompts.js";
import { diffToNewCode } from "../squiggle/processSquiggleCode.js";

function adjustToFeedbackPrompt(
  prompt: string,
  code: Extract<Code, { type: "success" }>
): PromptPair {
  const fullPrompt = `You are an expert in mathematical modeling and validation. Your task is to review the model results and suggest changes if the outputs seem incorrect or if there are test cases that fail.

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

Please validate the model results with these considerations:
1. **Mathematical Soundness**: Are the calculations logically consistent with the model's assumptions and principles?
2. **Range Check**: Are outputs within reasonable bounds? Does the model produce surprising results or results that seem implausible or overconfident?
3. **Test Cases**: Do all of the test cases pass? If not, suggest fixes in the code or the test cases. If the test case is complex, failing, and will be difficult to fix, delete it.

Remember:
- Suggest fixes for mathematical errors, test cases, and results that seem implausible or overconfident. Do not suggest fixes for style changes or documentation.
- If outputs are surprising but mathematically reasonable upon consideration, do not adjust the model
- Default to trusting the model unless you find specific flaws

If the model is mathematically sound (most cases), respond with:
<response>
NO_ADJUSTMENT_NEEDED
</response>
In this case, do not provide any code or explanation.

If you find genuine changes, provide the following format:
**Response Format (for changes):**
${changeFormatPrompt}
`;

  const summarizedPrompt = `Validate mathematical model results for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Check for logical consistency and numerical accuracy.`;

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
