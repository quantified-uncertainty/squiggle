import { codeToCodeState } from "../CodeState";
import { LLMStepTemplate } from "../LLMStep";
import { addStepByCodeState } from "./utils";

export const runAndFormatCodeStep = new LLMStepTemplate(
  "RunAndFormatCode",
  {
    inputs: { code: "code", prompt: "prompt" },
    outputs: { codeState: "codeState" },
  },
  async (context, { code, prompt }) => {
    const codeState = await codeToCodeState(code.value);
    addStepByCodeState(context.workflow, codeState, prompt.value);
  }
);
