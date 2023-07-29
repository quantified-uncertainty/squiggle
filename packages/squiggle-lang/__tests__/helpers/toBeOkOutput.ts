import { SqOutputResult } from "../../src/public/types.js";

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
  toBeOkOutput(outputR: SqOutputResult, result: string, bindings: string) {
    if (!outputR.ok) {
      return {
        pass: false,
        message: () => `Expected: ok output\n` + `Received: ${outputR.value}`,
      };
    }
    const gotResult = outputR.value.result.toString();
    if (gotResult !== result) {
      return {
        pass: false,
        message: () =>
          `Expected result: ${result}\n` + `Received: ${gotResult}`,
      };
    }

    const gotBindings = outputR.value.bindings.toString();
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
