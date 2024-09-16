import { codeStringToCode } from "../CodeState";
import { LLMStepTemplate } from "../LLMStep";

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
