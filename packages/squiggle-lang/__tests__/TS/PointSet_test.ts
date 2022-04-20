import { errorValueToString } from "../../src/js/index";
import { testRun, failDefault, expectErrorToBeBounded } from "./TestHelpers";
import * as fc from "fast-check";

describe("Mean of mixture is weighted average of means", () => {
  test("mx(beta(a,b), lognormal(m,s), [x,y])", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1e-1 }), // alpha
        fc.float({ min: 1 }), // beta
        fc.float(), // mu
        fc.float({ min: 1e-1 }), // sigma
        fc.float({ min: 1e-7 }),
        fc.float({ min: 1e-7 }),
        (a, b, m, s, x, y) => {
          let squiggleString = `mean(mx(beta(${a},${b}), lognormal(${m},${s}), [${x}, ${y}]))`;
          let res = testRun(squiggleString);
          switch (res.tag) {
            case "Error":
              expect(errorValueToString(res.value)).toEqual(
                "<I wonder if test cases will find this>"
              );
              break;
            case "Ok":
              let weightDenom = x + y;
              let betaWeight = x / weightDenom;
              let lognormalWeight = y / weightDenom;
              let betaMean = 1 / (1 + b / a);
              let lognormalMean = m + s ** 2 / 2;
              if (res.value.tag == "number") {
                expectErrorToBeBounded(
                  res.value.value,
                  betaWeight * betaMean + lognormalWeight * lognormalMean,
                  1,
                  -1
                );
              } else {
                expect(res.value.value).toEqual("some error message");
              }
              break;
            default:
              failDefault();
              break;
          }
        }
      )
    );
  });
});
