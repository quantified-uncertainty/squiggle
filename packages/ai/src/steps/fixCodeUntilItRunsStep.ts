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

1. **Comprehensive Analysis**: Carefully analyze the code and error message to identify both the immediate cause of the error and any related issues that could stem from the same root cause. Consider errors related to the logic, structure, or syntax that may not be reflected directly in the error message.
   
2. **Find and Fix All Instances**: If the error is found in multiple locations or is part of a larger pattern, apply the fix to **all occurrences**. Ensure that no instances of the same issue remain in the code. Make sure to read through the rest of the code after your initial fix idea, to find potential additional fixes.

3. **Reasoning and Fix Documentation**: Provide detailed reasoning for your chosen fix, including an explanation of why it is the most appropriate solution. For each fix, explain how it resolves the error and ensure that the corrected code maintains the intended functionality.

4. **Return Valid Code**: Ensure that the corrected code can execute successfully without further errors. If the fix involves structural changes, ensure the code still returns the necessary values or outputs where applicable.

5. **Reflection and Code Review**: After making changes, reflect on the solution to ensure that all parts of the code are consistent with the fix. If the fix needs to be applied elsewhere, ensure that similar corrections are made globally in the code.

### Additional Requirements:
- Use Squiggle documentation to support your solution where necessary.
- If the error message points to a location distant from the actual issue (due to limitations in error handling), carefully evaluate the context and resolve the issue where appropriate. The real issue is often a few lines away from the place the bug is thought to be. 
- Often, once you make one fix, another obvious issue emerges. Think through if this will happen - if so, try to fix this now as well. 
- Use SEARCH/REPLACE blocks for each fix, ensuring that they capture the necessary scope for each correction.

<original_code_with_line_numbers>
${addLineNumbers(code.source)}
</original_code_with_line_numbers>

<error_message>
${error}
</error_message>

<advice>
${advice || "No specific advice provided."}
</advice>

**Response Format:**
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

    const newCodeResult = await diffCompletionContentToCode(
      completion,
      code.value
    );
    if (newCodeResult.ok) {
      return { code: newCodeResult.value };
    } else {
      return context.fail("MINOR", newCodeResult.value);
    }
  }
);
