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
  expect("be reached").toBe("codepath should never be");
}
