import fs from "fs";

import { getSquiggleAdvice } from "./getSquiggleAdvice";

const SQUIGGLE_DOCS_PATH = "./src/llmScript/squiggleDocs.md";

// Utility functions
const readTxtFileSync = (filePath: string) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`Error reading file: ${err}`);
    throw err;
  }
};
// Load Squiggle docs
export const squiggleDocs = readTxtFileSync(SQUIGGLE_DOCS_PATH);

export type PromptPair = {
  fullPrompt: string;
  summarizedPrompt: string;
};

export const generateNewSquiggleCodePrompt = (prompt: string): PromptPair => {
  const fullPrompt = `You are an expert Squiggle code developer. Create concise, efficient Squiggle code based on the given prompt. Follow these guidelines:

1. Analyze the prompt carefully to understand all key requirements.
2. Generate functional, streamlined Squiggle code that addresses all main points of the prompt.
3. Use concise variable names.
4. Implement basic error handling and consider edge cases.
5. Format your code using triple backticks with 'squiggle' specified.
6. Make sure to follow the prompt.
7. Add at least one test per complex function, using sTest, to test functionality, if the prompt requests more than 10 lines of code (explicitly or implicitly).
8. Undershoot what the prompt asks for, in scope, by around 40%. If the prompt asks for 100 lines, try to provide 60. Things will be expanded more in future steps.
9. If the prompt requests changes to existing code, try to keep somewhat close to that code.

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
const changeFormat = `
Response format:
Provide your changes using SEARCH/REPLACE blocks as follows. You can use multiple SEARCH/REPLACE blocks if needed. 

IMPORTANT: Ensure that each SEARCH block is unique within the code. If you encounter potential duplicates, use a larger block of code in the SEARCH to ensure uniqueness.

Do not summarize code, with statements like "(rest of the code remains unchanged until the output results)". Write out the full diff. You can use multiple targeted difs in order to not need to write much code.

<changes>
<<<<<<< SEARCH
// Unique block of code to be replaced
=======
// New code that fixes the error or improves the existing code
>>>>>>> REPLACE
</changes>

<explanation>
Brief explanation of changes and why they were necessary (1-2 sentences max)
</explanation>

Examples:

1. Multiple changes (adding a comment and fixing a calculation):
<changes>
<<<<<<< SEARCH
calculateArea(r) = {
  Math.PI * r * r
}
=======
// Calculate the area of a circle given its radius
calculateArea(r) = {
  Math.PI * r ** 2
}
>>>>>>> REPLACE
<<<<<<< SEARCH
calculateVolume(r, h) = {
  Math.PI * r * r * h
}
=======
// Calculate the volume of a cylinder given its radius and height
calculateVolume(r, h) = {
  Math.PI * r ** 2 * h
}
>>>>>>> REPLACE
</changes>

<explanation>
Added comments to explain the functions' purposes and corrected the power operation for radius in both area and volume calculations.
</explanation>

2. Larger block to ensure uniqueness:
<changes>
<<<<<<< SEARCH
function processData(data) {
  // Process the data
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i] * 2;
  }
  return data;
}
=======
function processData(data) {
  // Process the data using map for better readability
  return data.map(item => item * 2);
}
>>>>>>> REPLACE
</changes>

<explanation>
Replaced the for loop with a map function for cleaner and more functional code.
</explanation>
`;

export const editExistingSquiggleCodePrompt = (
  existingCode: string,
  error: string
): PromptPair => {
  const advice = getSquiggleAdvice(error, existingCode);
  const fullPrompt = `You are an expert Squiggle code debugger. Your task is solely to fix an error in the given Squiggle code. Follow these steps:

1. Carefully analyze the original code and the error message.
2. Consider the provided advice, if any.
3. Maintain the original code structure where possible.
4. Focus solely on fixing the error; avoid unrelated changes.
5. If multiple solutions exist, choose the most efficient one.
6. Explain the root cause of the error and your fix in a brief comment within the code.
7. Ensure the new code is a standalone model that can replace the original entirely.
8. Do not include explanations or comments outside the code.

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

${changeFormat}
`;

  const summarizedPrompt = `Debug Squiggle code. Error: ${error.substring(0, 300)}${error.length > 300 ? "..." : ""}. Fix the error while maintaining code structure and efficiency.`;

  return { fullPrompt, summarizedPrompt };
};

export const adjustToFeedbackPrompt = (
  prompt: string,
  bindings: any,
  result: any
): PromptPair => {
  const fullPrompt = `You are an expert Squiggle code reviewer. Your task is to review and potentially improve Squiggle code based on the given prompt and previous output.

Original prompt:
<original_prompt>
${prompt}
</original_prompt>

Review the code and output. Consider these criteria:
1. Does the code match the prompt? Does it need to be longer or shorter? Does it include the right components? When in doubt between the prompt and other criteria, follow the prompt.
2. Use descriptive variable names (e.g., "human_lifespan" instead of "hl").
3. Include a brief summary comment at the top (use // for one line, /* ... */ for multiple lines).
4. Add appropriate @name, @doc, @format, and other tags. Use @name and @doc where variable names aren't easily understood. @name is preffered to @doc, but if there's a lot of key information to add, use @doc as well. 
5. Check for unexpected results or failing tests.
6. Add additional tests (using sTest) for uncovered failure points.
7. Handle edge cases and implement error handling where necessary.

If no adjustments are needed (this should be the common response), respond with:
<response>
NO_ADJUSTMENT_NEEDED
</response>

If adjustments are strongly needed, provide the full adjusted code and a brief explanation:

${changeFormat}

Aim for concise, effective code that meets all requirements and handles edge cases. Pay special attention to any important errors in the variables or result, and recommend changes if you notice any. However, there should be a fairly low bar for responding with NO_ADJUSTMENT_NEEDED. If you do recommend changes, provide your best recommendation, all things considered.

Focus on improving clarity, efficiency, and adherence to requirements. Only recommend changes for substantial improvements or to fix important issues.

Previous output:
<previous_output>
Variables: ${JSON.stringify(bindings, null, 2)}
Result: ${JSON.stringify(result, null, 2)}
</previous_output>
`;

  const summarizedPrompt = `Review and potentially improve Squiggle code for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Consider variable names, comments, tags, tests, and edge cases.`;

  return { fullPrompt, summarizedPrompt };
};
