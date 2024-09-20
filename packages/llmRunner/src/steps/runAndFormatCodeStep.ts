import { codeStringToCode } from "../CodeState.js";
import { LLMStepTemplate } from "../LLMStep.js";

export const runAndFormatCodeStep = new LLMStepTemplate(
  "RunAndFormatCode",
  {
    inputs: { source: "source" },
    outputs: { code: "code" },
  },
  async (context, { source }) => {
    const code = await codeStringToCode(source.value);
    context.setOutput("code", code);
  }
);
