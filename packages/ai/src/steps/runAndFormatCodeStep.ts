import { codeStringToCode } from "../Code.js";
import { LLMStepTemplate } from "../LLMStepTemplate.js";

export const runAndFormatCodeStep = new LLMStepTemplate(
  "RunAndFormatCode",
  {
    inputs: { source: "source" },
    outputs: { code: "code" },
  },
  async (_, { source }) => {
    const code = await codeStringToCode(source.value);
    return { code };
  }
);
