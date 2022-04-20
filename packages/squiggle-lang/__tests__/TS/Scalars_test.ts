import {
  run,
  Distribution,
  resultMap,
  squiggleExpression,
  errorValueToString,
  errorValue,
  result,
} from "../../src/js/index";
import * as fc from "fast-check";

let testRun = (x: string): result<squiggleExpression, errorValue> => {
  return run(x, { sampleCount: 100, xyPointLength: 100 });
};

describe("Scalar manipulation is well-modeled by javascript math", () => {
  test("in the case of logarithms (with assignment)", () => {
    fc.assert(
      fc.property(fc.float(), (x) => {
        let squiggleString = `x = log(${x}); x`;
        let squiggleResult = testRun(squiggleString);
        if (x == 0) {
          expect(squiggleResult.value).toEqual({
            tag: "number",
            value: -Infinity,
          });
        } else if (x < 0) {
          expect(squiggleResult.value).toEqual({
            tag: "RETodo",
            value:
              "somemessage (confused why a test case hasn't pointed out to me that this message is bogus)",
          });
        } else {
          expect(squiggleResult.value).toEqual({
            tag: "number",
            value: Math.log(x),
          });
        }
      })
    );
  });

  test("in the case of addition (with assignment)", () => {
    fc.assert(
      fc.property(fc.float(), fc.float(), fc.float(), (x, y, z) => {
        let squiggleString = `x = ${x}; y = ${y}; z = ${z}; x + y + z`;
        let squiggleResult = testRun(squiggleString);
        switch (squiggleResult.tag) {
          case "Error":
            expect(errorValueToString(squiggleResult.value)).toEqual(
              "some message (hopefully a test case points it out to me)"
            );
          case "Ok":
            expect(squiggleResult.value).toEqual({
              tag: "number",
              value: x + y + z,
            });
        }
      })
    );
  });
});
