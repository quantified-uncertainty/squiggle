import { README } from "./squiggle/README.js";
import { addLineNumbers } from "./squiggle/searchReplace.js";
import { LIBRARY_CONTENTS } from "./squiggle/squiggleLibraryContents.js";

// Used as context for Claude, and as first message for other LLMs.
export const squiggleSystemContent: string = `You are an AI assistant specialized in generating Squiggle code. Squiggle is a probabilistic programming language designed for estimation. Always respond with valid Squiggle code enclosed in triple backticks (\`\`\`). Do not give any more explanation, just provide the code and nothing else. Think through things, step by step.

Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.

Here's the full Squiggle Documentation. It's important that all of the functions you use are contained here. Check this before finishing your work.

${README}

## Available libraries:

${[...LIBRARY_CONTENTS.entries()]
  .map(([name, content]) => `### Library ${name} \n\n ${content}`)
  .join("\n\n")}`;

export type PromptPair = {
  fullPrompt: string;
  summarizedPrompt: string;
};

export const changeFormatPrompt = `
**Response Format:**

Your response **must** include:

1. **Brief Explanation**: A very short explanation (4-15 words) of the root cause of the error and your fix, placed inside an \`<explanation>\` block.

2. **Minimal Code Change Block**: The smallest possible code change needed to fix the error, provided inside an \`<edit>\` block.

**Instructions:**

- Do **not** include any content outside the \`<explanation>\` and \`<edit>\` blocks.

- In the \`<edit>\` block:
  - Start with \`<<<<<<< SEARCH\`.
  - Include **only** the exact lines to be replaced from the original code. Copy them exactly, including comments and whitespace.
  - Use \`=======\` as a divider.
  - Provide the corrected code in the replace section.
  - End with \`>>>>>>> REPLACE\`.
  - Ensure the **SEARCH** section matches the original code **exactly**.
  - Keep the code change minimal—avoid adding extra code or making unrelated changes.
  - **Every** \`SEARCH\` section must **exactly match** the existing file content, character for character, including all comments, docstrings, etc.
  - \`SEARCH/REPLACE\` blocks will replace **all** matching occurrences. Include enough lines to make the \`SEARCH\` blocks uniquely match the lines to change.
  - To move code within a file, use 2 \`SEARCH/REPLACE\` blocks: one to delete it from its current location, and one to insert it in the new location.

- Do **not** include explanations or comments outside the specified blocks.

**Example:**

Input (with line numbers):
<original_code_with_line_numbers>
${addLineNumbers(`calculateCircleArea(r) = {
  Math.PI * r * r;
}
myFn(x) = {
  x * 2;
}
`)}
</original_code_with_line_numbers>

Output:

<explanation>
Fixed exponentiation and function naming for clarity
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
`;
