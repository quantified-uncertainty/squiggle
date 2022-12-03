import { testRun } from "../helpers/helpers";
import * as fc from "fast-check";
import { testEvalToBe } from "../helpers/reducerHelpers";

describe("sampleN", () => {
  testEvalToBe("pointMass(5) -> sampleN(10) -> sum", "50");
  testEvalToBe("pointMass(5) -> sampleN(10) -> sum", "50");

  testEvalToBe("normal(5, 2) -> sampleN(100) -> List.length", "100");
});

describe("Symbolic mean", () => {
  test("mean(triangular(x,y,z))", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (x, y, z) => {
        if (!(x < y && y < z)) {
          try {
            let squiggleResult = testRun(`mean(triangular(${x},${y},${z}))`);
            expect(squiggleResult.value).toBeCloseTo((x + y + z) / 3);
          } catch (err) {
            expect((err as Error).message).toEqual(
              "Expected squiggle expression to evaluate but got error: Distribution Math Error: Triangular values must be increasing order."
            );
          }
        }
      })
    );
  });
});
