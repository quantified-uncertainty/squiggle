import { LLMStepTemplate } from "../LLMStep.js";
import { generationCompletionContentToCode } from "../processSquiggleCode.js";
import { PromptPair } from "../prompts.js";

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
7. Add at least one test per complex function, using sTest, to test functionality, if the prompt requests more than 10 lines of code (explicitly or implicitly).
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
          type: "codeRunError",
          error: state.value,
        });
      }
    }
  }
);
