import { allSquiggleAiLibraries, getDocumentationBundle } from "@quri/content";

import { addLineNumbers } from "./squiggle/searchReplace.js";

// Used as context for Claude, and as first message for other LLMs.
export const squiggleSystemPrompt: string = `You are an AI assistant specialized in generating Squiggle code. Squiggle is a probabilistic programming language designed for estimation. Always respond with valid Squiggle code enclosed in triple backticks (\`\`\`). Do not give any more explanation, just provide the code and nothing else. Think through things, step by step.

Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.

Here's the full Squiggle Documentation. It's important that all of the functions you use are contained here. Check this before finishing your work.

${await getDocumentationBundle()}

## Available libraries:

${allSquiggleAiLibraries
  .map(({ owner, slug, code }) => `### Library ${owner}/${slug}\n\n${code}`)
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
  - For each change, create a separate SEARCH/REPLACE block:
    - Start with \`<<<<<<< SEARCH\`
    - Include the exact lines to be replaced
    - Use \`=======\` as a divider
    - Provide the corrected code
    - End with \`>>>>>>> REPLACE\`
  - **Critical for Moving Code:**
    - When moving code, you need TWO separate SEARCH/REPLACE blocks in this order:
      1. First block REMOVES the code from its original location
      2. Second block ADDS it to its new location
    - Include enough surrounding context in each block to uniquely identify the location
    - Remember that blocks are processed in order, so removal must come before addition
  - The SEARCH section must match existing code exactly, including whitespace and comments
  - SEARCH/REPLACE blocks replace ALL matching occurrences, so make them unique!

- Do **not** include explanations or comments outside the specified blocks.

**Examples:**

1. Simple Fix:
<original_code_with_line_numbers>
${addLineNumbers(`@name("💰 Expected Cost ($)")
@format("$.2s")
flightCost = normal({ mean: 600, stdev: 100 })
`)}
</original_code_with_line_numbers>

<explanation>
Updated normal distribution parameters for better accuracy
</explanation>
<edit>
<<<<<<< SEARCH
flightCost = normal({ mean: 600, stdev: 100 })
=======
flightCost = normal({ mean: 650, stdev: 120 })
>>>>>>> REPLACE
</edit>

2. Moving Code (with two blocks):
<original_code_with_line_numbers>
${addLineNumbers(`@name("💰 Expected Cost ($)")
@format("$.2s")
flightCost = normal({ mean: 600, stdev: 100 })
@name("🥇 Expected Benefit ($)")
@format("$.2s")
benefitEstimate = normal({ mean: 1500, stdev: 300 })

import "hub:ozziegooen/sTest" as sTest`)}
</original_code_with_line_numbers>

<explanation>
Move import statement to top of file
</explanation>
<edit>
<<<<<<< SEARCH
import "hub:ozziegooen/sTest" as sTest
=======
>>>>>>> REPLACE

<<<<<<< SEARCH
@name("💰 Expected Cost ($)")
=======
import "hub:ozziegooen/sTest" as sTest

@name("💰 Expected Cost ($)")
>>>>>>> REPLACE
</edit>

Key Points for Code Movement:
- First block removes code from original location
- Second block adds code to new location
- Each block includes enough context to be unique
- Order matters: remove first, then add
`;
