import { SqScale } from "@quri/squiggle-lang";

import { sqScaleToD3 } from "../src/lib/d3/index.js";

describe.each([
  new SqScale({ method: { type: "linear" } }),
  new SqScale({ method: { type: "log" } }),
  new SqScale({ method: { type: "symlog" } }),
  new SqScale({ method: { type: "power" } }),
])("%s", (sqScale) => {
  const scale = sqScaleToD3(sqScale);

  const format = scale.tickFormat(10);

  describe.each([
    [0.000003, "3e-6"],
    [0.00003, "0.00003"],
    [0.0003, "0.0003"],
    [0.000123456789, "0.000123457"],
    [0.03, "0.03"],
    [0, "0"],
    [0.3, "0.3"],
    [5_500, "5500"],
    [5_000_000, "5M"],
    [5_000_000_000, "5B"],
    [5_000_000_000_000, "5T"],
    [5_000_000_000_000_000, "5e+15"],
  ])("%f -> %s", (num, result) => {
    if (num === 0 && sqScale.method?.type === "log") {
      return;
    }
    test("positive", () => {
      expect(format(num)).toEqual(result);
    });

    if (num !== 0 && !(sqScale.method?.type === "log")) {
      test("negative", () => {
        expect(format(-num)).toEqual(result === "0" ? result : "-" + result);
      });
    }
  });
});
