import { getLLMStyleGuide } from "@quri/content";

import { Code, codeStringToCode } from "../Code.js";
import { LLMStepTemplate } from "../LLMStepTemplate.js";
import { changeFormatPrompt, PromptPair } from "../prompts.js";
import { diffToNewCode } from "../squiggle/processSquiggleCode.js";
import { addLineNumbers } from "../squiggle/searchReplace.js";

const styleGuideText: string = await getLLMStyleGuide();

function matchStyleGuidePrompt(
  prompt: string,
  code: Extract<Code, { type: "success" }>
): PromptPair {
  const fullPrompt = `You are an expert Squiggle code reviewer focused on enforcing style guide compliance and code quality standards. Please review the code and output and suggest changes to match the style guide.

- If the code is over 10 lines long, make sure there is a valid "summary" document with a @notebook and @startOpen tag. This should feature a combination of paragraphs and bullet points.
- Pay extra attention to documenting variables and factors that are uncertain or might change depending on context (for example, a parameter that would be high for old or poor people, but low for rich people). 
- Add @doc tags to variables that are uncertain or might change depending on context, and add information into the notebook summary about these.
- Make sure to format Squiggle numbers and Squiggle dates when used in notbooks. For example, "String(45.235, "%.2")".
- To convert distributions into strings, use scripts like \`String(Dist.inv(dist, 0.05), ",.2f") + " to " + String(Dist.inv(dist, 0.95), ",.2f")\`.

Have a very low bar for suggesting improvements.

**No Adjustments**
If no adjustments are recommended, respond with:

<response>
NO_ADJUSTMENT_NEEDED
</response>

In this is the case, do not provide any code or explanation.

**Adjustments**
If adjustments are advised, provide the fully adjusted code and a very brief explanation (4-10 words). 

<original_prompt>
${prompt}
</original_prompt>

<original_code>
${addLineNumbers(code.source)}
</original_code>

<previous_output>
Variables: "${code.result.bindings}"
Result: "${code.result.result}"
</previous_output>

**Response Format (for changes)**
${changeFormatPrompt}

** Style Guide **
${styleGuideText}
`;

  const summarizedPrompt = `Review and potentially improve Squiggle code for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Match the corresponding style guide.`;

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
      code: "code?",
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
      return context.fail("MINOR", "No completion");
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
      return { code: undefined };
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
        return { code };
      }

      const adjustedCode = await codeStringToCode(diffResponse.value);
      return { code: adjustedCode };
    } else {
      context.log({
        type: "info",
        message: "No adjustments provided, considering process complete",
      });
      return { code: undefined };
    }
  }
);
