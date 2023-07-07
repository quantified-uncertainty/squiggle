import { expect } from "@jest/globals";

import { SqValue } from "../../src/index.js";

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualSqValue(expected: SqValue): CustomMatcherResult;
    }
  }
}

expect.extend({
  toEqualSqValue(x: SqValue, y: SqValue) {
    const xString = x.toString();
    const yString = y.toString();
    if (xString === yString) {
      return {
        pass: true,
        message: () => "",
      };
    } else {
      return {
        pass: false,
        message: () => `Expected: ${xString}\n` + `Received: ${yString}`,
      };
    }
  },
});
