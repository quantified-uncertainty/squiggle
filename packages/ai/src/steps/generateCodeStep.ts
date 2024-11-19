import { LLMStepTemplate } from "../LLMStepTemplate.js";
import { PromptPair } from "../prompts.js";
import { generationCompletionContentToCode } from "../squiggle/processSquiggleCode.js";

export const generateNewSquiggleCodePrompt = (prompt: string): PromptPair => {
  if (!prompt || prompt === "") {
    throw new Error("Prompt is required");
  }
  const fullPrompt = `You are an expert Squiggle code developer. Create Squiggle code based on the given prompt. Follow these guidelines:

1. Analyze the prompt carefully to understand all key requirements.
2. Create a model and think through the details of it. Does it make sense? Are there any key points that are not covered?
3. Generate functional, streamlined Squiggle code that addresses all main points of the prompt.
4. Implement basic error handling and consider edge cases. Note that try() blocks need else statements and variable assignments.
5. Format your code using triple backticks with 'squiggle' specified.
6. Make sure to follow the prompt.
7. Add at least one test per complex function, using sTest, to test functionality, if the prompt requests more than 10 lines of code (explicitly or implicitly). Assign sTest.describe() blocks to variables, like this: \`function1_tests = sTest.describe(...)\`. Note that you cannot use multiple sTest.expect() calls in a single test() block.
8. If the prompt requests changes to existing code, try to keep somewhat close to that code.
9. Use \`@name\` annotations for concise descriptions; use \`@doc\` when further details are necessary.

## Dictionaries and Blocks
In Squiggle, you can create dictionaries using two different syntaxes, each with distinct capabilities:

### Simple Dictionaries
Use this syntax for basic key-value pairs without internal calculations:
\`\`\`squiggle
initialCosts = {
  rentDeposit: 5k to 15k,
  equipmentCost: 20k to 40k,
}
\`\`\`

For single-value dictionary returns, add a trailing comma. However, this pattern should be done rarely. It's often better to just return the value directly.

Example with trailing comma:
\`\`\`squiggle
initialCosts = {
  rentDeposit = 5k to 15k
  equipmentCost = 20k to 40k
  total = rentDeposit + equipmentCost
  {total,}
}
\`\`\`
Prefer this instead:
\`\`\`squiggle
initialCostTotal = {
  rentDeposit = 5k to 15k
  equipmentCost = 20k to 40k
  rentDeposit + equipmentCost 
}
\`\`\`

### Blocks
Use blocks when you need to:
- Perform calculations with dictionary values
- Add metadata tags
- Reference values within the dictionary

Basic block example:
\`\`\`squiggle
initialCosts = {
  rentDeposit = 5k to 15k
  equipmentCost = 20k to 40k
  total = rentDeposit + equipmentCost
  {subcosts: {rentDeposit, equipmentCost}, total}
}
\`\`\`

### Adding Tags
The recommended way to add tags is using block syntax:
\`\`\`squiggle
initialCosts = {
  @name("rent deposit")
  @format("$,.0f")
  rentDeposit = 5k to 15k

  @name("equipment cost")
  @format("$,.0f")
  equipmentCost = 20k to 40k

  @format("$,.0f")
  total = rentDeposit + equipmentCost

  {subcosts: {rentDeposit, equipmentCost}, total}
}
\`\`\`

Don't add tags to variables that are only used internally. The tags are only useful when variables are externally accessible.

### Common Mistakes to Avoid

1. Missing return value in blocks:
\`\`\`squiggle
// Won't work - blocks must return a value
initialCosts = {
  rentDeposit = 5k to 15k
  equipmentCost = 20k to 40k
  total = rentDeposit + equipmentCost
}
\`\`\`

2. Internal references in simple dictionaries:
\`\`\`squiggle
// Won't work - simple dicts can't reference internal values
initialCosts = {
  rentDeposit: 5k to 15k,
  equipmentCost: 20k to 40k,
  total: rentDeposit + equipmentCost
}
\`\`\`

While you can use arrow syntax for tags in dictionary blocks (\`->Tag.format("$,.0f")\`), it's generally clearer to use the \`@tag\` syntax shown above.

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

export const generateCodeStep = new LLMStepTemplate(
  "GenerateCode",
  {
    inputs: { prompt: "prompt" },
    outputs: { code: "code" },
  },
  async (context, { prompt }) => {
    const promptPair = generateNewSquiggleCodePrompt(prompt.value);
    const completion = await context.queryLLM(promptPair);

    if (!completion) {
      return context.fail("MINOR", "No completion");
    }

    const state = await generationCompletionContentToCode(completion);
    if (state.ok) {
      return { code: state.value };
    } else {
      return context.fail("MINOR", state.value);
    }
  }
);
