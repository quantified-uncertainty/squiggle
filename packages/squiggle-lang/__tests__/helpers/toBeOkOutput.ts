import { SqModuleOutput } from "../../src/public/SqProject/SqModuleOutput.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      toBeOkOutput(output: string, bindings: string): CustomMatcherResult;
    }
  }
}

expect.extend({
  toBeOkOutput(output: SqModuleOutput, result: string, bindings: string) {
    const outputResult = output.result;
    if (!outputResult.ok) {
      return {
        pass: false,
        message: () =>
          `Expected: ok output\n` + `Received: ${outputResult.value}`,
      };
    }
    const gotResult = outputResult.value.result.toString();
    if (gotResult !== result) {
      return {
        pass: false,
        message: () =>
          `Expected result: ${result}\n` + `Received: ${gotResult}`,
      };
    }

    const gotBindings = outputResult.value.bindings.toString();
    if (gotBindings !== bindings) {
      return {
        pass: false,
        message: () =>
          `Expected bindings: ${bindings}\n` + `Received: ${gotBindings}`,
      };
    }

    return {
      pass: true,
      message: () => "",
    };
  },
});
