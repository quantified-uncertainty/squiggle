import { codeToCodeState } from "../CodeState";
import { LLMStepTemplate } from "../LLMStep";

export const runAndFormatCodeStep = new LLMStepTemplate(
  "RunAndFormatCode",
  {
    inputs: { code: "code" },
    outputs: { codeState: "codeState" },
  },
  async (context, { code }) => {
    const codeState = await codeToCodeState(code.value);
    context.setOutput("codeState", {
      kind: "codeState",
      value: codeState,
    });
  }
);
