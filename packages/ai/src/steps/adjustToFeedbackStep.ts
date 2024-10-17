import { Code, codeStringToCode } from "../Code.js";
import { LLMStepTemplate } from "../LLMStepTemplate.js";
import { changeFormatPrompt, PromptPair } from "../prompts.js";
import { diffToNewCode } from "../squiggle/processSquiggleCode.js";

function adjustToFeedbackPrompt(
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

Please review the code and output according to the following criteria:

1. **Prompt Adherence**: Does the code fully address the prompt? Should it be shorter or longer? Are all required components included? In case of ambiguity between the prompt and other criteria, prioritize the prompt.
2. **Variable Naming**: Use clear and descriptive variable names (e.g., \`human_lifespan\` instead of \`hl\`).
3. **Comments**: Ensure that there are lengthy annotations and comments explaining the code. Use \`//\` for single-line comments and \`/* ... */\` for multi-line comments. Inlcude both the reasoning behind the model, and your takeaways after seeing the results.
4. **Summary**. Ensure that there is a long multi-line comment at the top of the file. It should both describe the code, and explain the results. Was anything surprising or unexpected?
4. **Tags**: Use \`@name\`, \`@doc\`, \`@format\`, and other relevant tags for variables (but not for files). Prefer \`@name\` for concise descriptions; use \`@doc\` when further details are necessary. Variables of particular interest should have a \`@startOpen\` tag. Variables that are small helpers should have a \`@hide\` tag.
5. **Error Detection**: Look for unexpected results or failed tests.
6. **Tests**: If the code is complex and lacks basic tests, add appropriate tests using \`sTest\` to handle uncovered failure points. Do not add tests if there are already tests in the code.
7. **Edge Cases**: Ensure that edge cases are handled and add simple error handling where appropriate.
8. **Remove Redundant Comments**: Delete any comments that no longer serve a purpose (e.g., comments explaining previous changes).
9. **Sensitivity Analysis**: Do not add sensitivity analysis functions.
10. **Style Guide**: Follow the included Squiggle Style Guide.

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
