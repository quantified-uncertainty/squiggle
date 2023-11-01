import { SqLogScale } from "@quri/squiggle-lang";
import { sqScaleToD3 } from "../src/lib/d3/index.js";

import { SqLinearScale } from "@quri/squiggle-lang";
import { SqSymlogScale } from "@quri/squiggle-lang";
import { SqPowerScale } from "@quri/squiggle-lang";

describe.each([
  SqLinearScale.create(),
  SqLogScale.create(),
  SqSymlogScale.create({}),
  SqPowerScale.create({}),
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
    if (num === 0 && sqScale instanceof SqLogScale) {
      return;
    }
    test("positive", () => {
      expect(format(num)).toEqual(result);
    });

    if (num !== 0 && !(sqScale instanceof SqLogScale)) {
      test("negative", () => {
        expect(format(-num)).toEqual(result === "0" ? result : "-" + result);
      });
    }
  });
});
