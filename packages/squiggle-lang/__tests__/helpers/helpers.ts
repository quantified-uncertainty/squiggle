import { run } from "../../src/index.js";

export async function testRun(x: string) {
  const outputR = await run(x, {
    environment: {
      sampleCount: 1000,
      xyPointLength: 100,
    },
  });

  if (outputR.ok) {
    return outputR.value.result;
  } else {
    throw new Error(
      `Expected squiggle expression to evaluate but got error: ${outputR.value}`
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
