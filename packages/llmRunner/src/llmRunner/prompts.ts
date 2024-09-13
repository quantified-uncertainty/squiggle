import fs from "fs";
import path from "path";

import { getSquiggleAdvice } from "./getSquiggleAdvice";
import { CodeState, codeStateErrorString } from "./LLMStep";
import { squiggleExampleContents } from "./squiggleExampleContents";
import { squiggleLibraryContents } from "./squiggleLibraryHelpers";

const SQUIGGLE_DOCS_PATH = path.join(
  process.cwd(),
  "src",
  "llmRunner",
  "squiggleDocs.md"
);

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

// Used as context for Claude, and as first message for other LLMs.
export const squiggleSystemContent: string = `You are an AI assistant specialized in generating Squiggle code. Squiggle is a probabilistic programming language designed for estimation. Always respond with valid Squiggle code enclosed in triple backticks (\`\`\`). Do not give any more explanation, just provide the code and nothing else. Think through things, step by step.

Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.

Here's the full Squiggle Documentation. It's important that all of the functions you use are contained here. Check this before finishing your work.

${squiggleDocs}

## Available libraries:

${[...squiggleLibraryContents.entries()]
  .map(([name, content]) => `### Library ${name} \n\n ${content}`)
  .join("\n\n")}
  
  
## Further Examples:

${[...squiggleExampleContents.entries()]
  .map(([name, content]) => `### Example ${name} \n\n ${content}`)
  .join("\n\n")}
`;

export type PromptPair = {
  fullPrompt: string;
  summarizedPrompt: string;
};

export const generateNewSquiggleCodePrompt = (prompt: string): PromptPair => {
  if (!prompt || prompt === "") {
    throw new Error("Prompt is required");
  }
  const fullPrompt = `You are an expert Squiggle code developer. Create concise, efficient Squiggle code based on the given prompt. Follow these guidelines:

1. Analyze the prompt carefully to understand all key requirements.
2. Generate functional, streamlined Squiggle code that addresses all main points of the prompt.
3. Use very concise variable names. They should be understandable to an LLM, but otherwise very short.
4. Implement basic error handling and consider edge cases.
5. Format your code using triple backticks with 'squiggle' specified.
6. Make sure to follow the prompt.
7. Add at least one test per complex function, using sTest, to test functionality, if the prompt requests more than 10 lines of code (explicitly or implicitly). Do not write tests for simple functions or simple functionality. Keep test code simple and concise, so that you do not need to debug it.
8. Undershoot what the prompt asks for, in scope, by around 40%. If the prompt asks for 100 lines, try to provide 60. Things will be expanded more in future steps. Refrain from using tags like @name, @doc, @format, etc. for styling.
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

Think step-by-step and explain the needed changes in a few short sentences.

1. Use <<<<<<< SEARCH to start the search section.
2. Include only the exact lines to be replaced, with surrounding context if needed for uniqueness. Use the exact same text as in the original code, do not change it at all.
3. Use ======= as a divider between search and replace sections.
4. Provide the new or modified code in the replace section.
5. Use >>>>>>> REPLACE to end the replace section.
6. For new files, use an empty SEARCH section.

Every *SEARCH* section must *EXACTLY MATCH* the existing file content, character for character, including all comments, docstrings, etc.
If the file contains code or other data wrapped/escaped in json/xml/quotes or other containers, you need to propose edits to the literal contents of the file, including the container markup.

*SEARCH/REPLACE* blocks will replace *all* matching occurrences.
Include enough lines to make the SEARCH blocks uniquely match the lines to change.

Keep *SEARCH/REPLACE* blocks concise.
Break large *SEARCH/REPLACE* blocks into a series of smaller blocks that each change a small portion of the file.
Include just the changing lines, and a few surrounding lines if needed for uniqueness.
Do not include long runs of unchanging lines in *SEARCH/REPLACE* blocks.

To move code within a file, use 2 *SEARCH/REPLACE* blocks: 1 to delete it from its current location, 1 to insert it in the new location.

Example:

<explanation>
Brief explanation of changes (1-2 sentences max)
</explanation>

<edit>
<<<<<<< SEARCH
  Math.PI * r * r
=======
  Math.PI * r ** 2
>>>>>>> REPLACE
<<<<<<< SEARCH
  myFn(x) = {
=======
  myFunction(x) = {
>>>>>>> REPLACE
</edit>

Do not include any code outside of SEARCH/REPLACE blocks. Ensure that the SEARCH section exactly matches the existing code.
`;

export const editExistingSquiggleCodePrompt = (
  existingCode: string,
  codeState: CodeState
): PromptPair => {
  const error = codeStateErrorString(codeState);
  const advice = getSquiggleAdvice(error, existingCode);
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
  currentCode: string,
  bindings: string,
  result: string
): PromptPair => {
  const fullPrompt = `You are an expert Squiggle code reviewer. Your task is to review and potentially improve Squiggle code based on the given prompt and previous output.

Original prompt:
<original_code>
${prompt}
</original_code>

Current code:
<current_code>
${currentCode}
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

${changeFormat}

Aim for concise, effective code that meets all requirements and handles edge cases. Pay special attention to any important errors in the variables or result, and recommend changes if you notice any. However, there should be a fairly low bar for responding with NO_ADJUSTMENT_NEEDED. If you do recommend changes, provide your best recommendation, all things considered.

Focus on improving clarity, efficiency, and adherence to requirements. Only recommend changes for substantial improvements or to fix important issues.

Previous output:
<previous_output>
Variables: "${bindings}"
Result: "${result}"
</previous_output>
`;

  const summarizedPrompt = `Review and potentially improve Squiggle code for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Consider variable names, comments, tags, tests, and edge cases.`;

  return { fullPrompt, summarizedPrompt };
};
