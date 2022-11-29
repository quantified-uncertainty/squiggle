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

/**
 * This appears also in `TestHelpers.res`. According to https://www.math.net/percent-error, it computes
 * absolute error when numerical stability concerns make me not want to compute relative error.
 * */
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
