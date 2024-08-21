import { getSquiggleAdvice } from "./getSquiggleAdvice";

export type PromptPair = {
  fullPrompt: string;
  summarizedPrompt: string;
};

export const generateNewSquiggleCodePrompt = (prompt: string): PromptPair => {
  const fullPrompt = `You are a Squiggle code generator. Create concise, efficient Squiggle code based on the given prompt. Follow these guidelines:

1. Analyze the prompt carefully to understand all key requirements.
2. Generate functional, streamlined Squiggle code that addresses all main points of the prompt.
3. Use concise variable names.
4. Implement basic error handling and consider edge cases.
5. Add at least one test per complex function, using sTest, to test functionality.
6. Format your code using triple backticks with 'squiggle' specified.

Prompt:
<prompt>
${prompt}
</prompt>

Response format:
\`\`\`squiggle
// Your code here
\`\`\`

Generate your Squiggle code response based on the given prompt. Include only the necessary code and essential, concise explanations within the response format. Prioritize clarity and correctness while minimizing token usage.`;

  const summarizedPrompt = `Generate concise Squiggle code for: ${prompt}. Include basic error handling, tests, and follow best practices.`;

  return { fullPrompt, summarizedPrompt };
};

export const editExistingSquiggleCodePrompt = (
  existingCode: string,
  error: string
): PromptPair => {
  const advice = getSquiggleAdvice(error, existingCode);
  const fullPrompt = `You are a Squiggle code debugger. Your task is to fix an error in the given Squiggle code. Follow these steps:

1. Carefully analyze the original code and the error message.
2. Consider the provided advice, if any.
3. Write a new, complete version of the code that fixes the error.
4. Maintain the original code structure where possible.
5. Focus solely on fixing the error; avoid unrelated changes.
6. If multiple solutions exist, choose the most efficient one.
7. Explain the root cause of the error and your fix in a brief comment within the code.
8. Ensure the new code is a standalone model that can replace the original entirely.
9. Do not include explanations or comments outside the code.

Original code:
<original_code>
${existingCode}
</original_code>

Error message:
<error_message>
${error}
</error_message>

Advice:
<advice>
${advice || "No specific advice provided."}
</advice>

Response format:
\`\`\`squiggle
// Your improved code here
\`\`\`

Provide only the improved code within the response format, without any additional text or explanations outside the code block.`;

  const summarizedPrompt = `Debug Squiggle code. Error: ${error.substring(0, 300)}${error.length > 300 ? "..." : ""}. Fix the error while maintaining code structure and efficiency.`;

  return { fullPrompt, summarizedPrompt };
};

export const adjustToFeedbackPrompt = (
  prompt: string,
  bindings: any,
  result: any
): PromptPair => {
  const fullPrompt = `You are a Squiggle code reviewer. Your task is to review and potentially improve Squiggle code based on the given prompt and previous output.

Original prompt:
<original_prompt>
${prompt}
</original_prompt>

Previous output:
<previous_output>
Variables: ${JSON.stringify(bindings, null, 2)}
Result: ${JSON.stringify(result, null, 2)}
</previous_output>

Review the code and output. Consider these criteria:
1. Use descriptive variable names (e.g., "human_lifespan" instead of "hl").
2. Include a brief summary comment at the top (use // for one line, /* ... */ for multiple lines).
3. Add appropriate @name, @doc, @format, and other tags. Use @name and @doc where variable names aren't easily understood. @name is preffered to @doc, but if there's a lot of key information to add, use @doc as well. 
4. Check for unexpected results or failing tests.
5. Add additional tests (using sTest) for uncovered failure points.
6. Ensure adherence to all original prompt requirements (e.g., line count).
7. Handle edge cases and implement error handling where necessary.

If no adjustments are needed (this should be the common response), respond with:
<response>
NO_ADJUSTMENT_NEEDED
</response>

If adjustments are strongly needed, provide the full adjusted code and a brief explanation:
\`\`\`squiggle
// Your adjusted code here
\`\`\`
Brief explanation of changes and why they were necessary (1-2 sentences max)
</explanation>
</response>

Aim for concise, effective code that meets all requirements and handles edge cases. Pay special attention to any important errors in the variables or result, and recommend changes if you notice any. However, there should be a fairly low bar for responding with NO_ADJUSTMENT_NEEDED. If you do recommend changes, provide your best recommendation, all things considered.

Focus on improving clarity, efficiency, and adherence to requirements. Only recommend changes for substantial improvements or to fix important issues.`;

  const summarizedPrompt = `Review and potentially improve Squiggle code for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Consider variable names, comments, tags, tests, and edge cases.`;

  return { fullPrompt, summarizedPrompt };
};
