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
10. In Squiggle, you can write dicts like:
\`\`\`squiggle
initialCosts = {
  rentDeposit: 5k to 15k,
  equipmentCost: 20k to 40k,
}
\`\`\`
If you want to do calculations with these values and return a dict, then use a block that returns a dict.

\`\`\`squiggle
initialCosts = {
  rentDeposit = 5k to 15k
  equipmentCost = 20k to 40k
  total = rentDeposit + equipmentCost
  {subcosts: {rentDeposit, equipmentCost}, total}
}
\`\`\`

The following will not work, because this is a block, and it must return a value at the end:
\`\`\`squiggle
initialCosts = {
  rentDeposit = 5k to 15k
  equipmentCost = 20k to 40k
  total = rentDeposit + equipmentCost
}
\`\`\`

The following will not work, because this is a dict, and dicts can't refer to internal values:
\`\`\`squiggle
initialCosts = {
  rentDeposit: 5k to 15k
  equipmentCost: 20k to 40k
  total: rentDeposit + equipmentCost
}
\`\`\`

If you want to tag any of these values, you must use the block format, like this:
\`\`\`squiggle
initialCosts = {
  @name("rent deposit")
  @format("$,.0f")
  rentDeposit = 5k to 15k

  @format("$,.0f")
  @name("equipment cost")
  equipmentCost = 20k to 40k

  @format("$,.0f")
  total = rentDeposit + equipmentCost
  {subcosts: {rentDeposit, equipmentCost}, total}
}
\`\`\`
If you want to use tags in dicts, you can do so like this. However, this can get messy.
\`\`\`squiggle
initialCosts = {
  rentDeposit = 5k to 15k -> Tag.format("$,.0f")
  ...
}
\`\`\`

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

    if (completion) {
      const state = await generationCompletionContentToCode(completion);
      if (state.ok) {
        context.setOutput("code", state.value);
      } else {
        context.log({
          type: "error",
          message: state.value,
        });
      }
    }
  }
);
