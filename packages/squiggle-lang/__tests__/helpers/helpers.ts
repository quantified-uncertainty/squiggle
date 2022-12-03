import { run } from "../../src";

expect.extend({
  toEqualSqValue(x, y) {
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

export function testRun(x: string) {
  const { result } = run(x, {
    environment: {
      sampleCount: 1000,
      xyPointLength: 100,
    },
  });

  if (result.ok) {
    return result.value;
  } else {
    throw new Error(
      `Expected squiggle expression to evaluate but got error: ${result.value}`
    );
  }
}

/*
This encodes the expression for percent error
The test says "the percent error of received against expected is bounded by epsilon"

However, the semantics are degraded by catching some numerical instability:
when expected is too small, the return of this function might blow up to infinity.
So we capture that by taking the max of abs(expected) against a 1.

A sanity check of this function would be welcome, in general it is a better way of approaching 
squiggle-lang tests than toBeSoCloseTo.
*/
export function expectErrorToBeBounded(
  received: number,
  expected: number,
  { epsilon }: { epsilon: number }
) {
  const distance = Math.abs(received - expected);
  const expectedAbs = Math.abs(expected);
  const normalizingDenom = Math.max(expectedAbs, 1);
  const error = distance / normalizingDenom;
  expect(error).toBeLessThanOrEqual(epsilon);
}
