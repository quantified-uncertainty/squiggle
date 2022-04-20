import { errorValueToString } from "../../src/js/index";
import { testRun } from "./TestHelpers";
import * as fc from "fast-check";

describe("Symbolic mean", () => {
  let triangularInputError = {
    tag: "Error",
    value: {
      tag: "RETodo",
      value: "Triangular values must be increasing order.",
    },
  };
  test("mean(triangular(x,y,z))", () => {
    fc.assert(
      fc.property(fc.float(), fc.float(), fc.float(), (x, y, z) => {
        let res = testRun(`mean(triangular(${x},${y},${z}))`);
        if (!(x < y && y < z)) {
          expect(res).toEqual(triangularInputError);
        } else {
          switch (res.tag) {
            case "Error":
              expect(errorValueToString(res.value)).toEqual(
                "<Test cases don't seem to be finding this>"
              );
            case "Ok":
              expect(res.value).toEqual({
                tag: "number",
                value: (x + y + z) / 3,
              });
          }
        }
      })
    );
  });
});
