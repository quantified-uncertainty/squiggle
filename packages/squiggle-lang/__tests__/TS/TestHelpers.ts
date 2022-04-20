import {
  run,
  Distribution,
  squiggleExpression,
  errorValueToString,
  errorValue,
  result,
} from "../../src/js/index";

export function testRun(x: string): any {
  //: result<squiggleExpression, errorValue> => {
  return run(x, { sampleCount: 1000, xyPointLength: 100 });
}

export function failDefault() {
  expect("be reached").toBe("codepath should never");
}

/**
 * This appears also in `TestHelpers.res`. According to https://www.math.net/percent-error, it computes
 * absolute error when numerical stability concerns make me not want to compute relative error.
 * */
export function expectErrorToBeBounded(
  received: number,
  expected: number,
  epsilon: number,
  digits: number
) {
  let distance = Math.abs(received - expected);
  let expectedAbs = Math.abs(expected);
  let normalizingDenom = Math.max(expectedAbs, 1);
  let error = distance / normalizingDenom;
  expect(Math.round(10 ** digits * error) / 10 ** digits).toBeLessThanOrEqual(
    epsilon
  );
}
