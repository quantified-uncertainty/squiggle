import { Plot } from "../../src/value/VPlot.js";
import {
  evaluateStringToResult,
  testEvalToBe,
  testEvalToMatch,
} from "../helpers/reducerHelpers.js";

async function testPlotResult<T extends Plot["type"]>(
  name: string,
  code: string,
  type: T,
  cb: (plot: Extract<Plot, { type: T }>) => void
) {
  test(name, async () => {
    const result = await evaluateStringToResult(code);
    if (!result.ok) {
      throw new Error(`Expected ok result, got: ${result.value}`);
    }
    if (result.value.type !== "Plot" || result.value.value.type !== type) {
      throw new Error("Expected numericFn plot");
    }
    cb(result.value.value as Extract<Plot, { type: T }>);
  });
}

describe("Plot", () => {
  describe("Plot.dists", () => {
    testEvalToBe(
      'Plot.dists({dists: [{name: "dist1", value: 2}, {name: "dist2", value: 2 to 5}]})',
      "Plot containing dist1, dist2"
    );
    testEvalToBe(
      'Plot.dists([{name: "dist1", value: 2}, {name: "dist2", value: 2 to 5}])',
      "Plot containing dist1, dist2"
    );
    testEvalToBe(
      "Plot.dists([(2), 2 to 10])",
      "Plot containing dist 1, dist 2"
    );
  });

  describe("Plot.numericFn", () => {
    testEvalToMatch(`Plot.numericFn({|x| x * 5})`, "Plot for numeric function");
    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5},
        xPoints: [10,20,40]
      })`,
      "Plot for numeric function"
    );

    testEvalToMatch(
      `Plot.numericFn({|x,y| x * 5})`,
      `Error(Error: There are function matches for Plot.numericFn(), but with different arguments:
  Plot.numericFn(fn: (Number) => Number, params?: {xScale?: Scale, yScale?: Scale, xPoints?: List(Number)}) => Plot
Was given arguments: ((x: any, y: any) => Duration|Number|Dist))`
    );

    testPlotResult(
      "default scale based on domain",
      `Plot.numericFn({|x: [3, 5]| x * 5})`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.method?.type).toBe("linear");
        expect(plot.xScale.min).toBe(3);
        expect(plot.xScale.max).toBe(5);
      }
    );

    testPlotResult(
      "explicit scale with min/max ignores the domain",
      `Plot.numericFn(
        {|x: [3, 5]| x * 5},
        {xScale: Scale.linear({ min: 100, max: 200 })}
      )`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.method?.type).toBe("linear");
        expect(plot.xScale.min).toBe(100);
        expect(plot.xScale.max).toBe(200);
      }
    );

    testPlotResult(
      "scale without min/max inherits domain boundaries",
      `Plot.numericFn(
        {|x: [3, 5]| x * 5},
        {xScale: Scale.log()}
      )`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.method?.type).toBe("log");
        expect(plot.xScale.min).toBe(3);
        expect(plot.xScale.max).toBe(5);
      }
    );

    testPlotResult(
      "scale without min/max, and with a constant, inherits domain boundaries",
      `Plot.numericFn(
        {|x: [3, 5]| x * 5},
        {xScale: Scale.symlog({ constant: 2 })}
      )`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.method?.type).toBe("symlog");
        expect(plot.xScale.min).toBe(3);
        expect(plot.xScale.max).toBe(5);
      }
    );

    testEvalToMatch(
      `Plot.numericFn(
        {|x| x * 5},
        {xScale: Scale.linear({ min: 100 })}
      )`,
      "Scale min set without max. Must set either both or neither."
    );

    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5},
        xScale: Scale.linear({ max: 100 })
      })`,
      "Scale max set without min. Must set either both or neither."
    );

    // scale with one of min/max fails even if domain is set
    testEvalToMatch(
      `Plot.numericFn(
        {|x: [3, 5]| x * 5},
        {xScale: Scale.log({ min: 100 })}
      )`,
      "Scale min set without max. Must set either both or neither."
    );
  });

  describe("Plot.distFn", () => {
    testEvalToMatch(`Plot.distFn({|x| x to x + 1})`, "Plot for dist function");

    testEvalToMatch(
      `Plot.distFn({|x,y| x to x + y})`,
      `Error(Error: There are function matches for Plot.distFn(), but with different arguments:
  Plot.distFn(fn: (Number) => Dist, params?: {xScale?: Scale, yScale?: Scale, distXScale?: Scale, xPoints?: List(Number)}) => Plot
Was given arguments: ((x: any, y: any) => SampleSetDist))`
    );
  });

  testPlotResult(
    "default scale based on domain",
    `Plot.distFn({|x: [3, 5]| uniform(x, x + 1)})`,
    "distFn",
    (plot) => {
      expect(plot.xScale.method?.type).toBe("linear");
      expect(plot.xScale.min).toBe(3);
      expect(plot.xScale.max).toBe(5);
    }
  );

  testPlotResult(
    "default scale based on time domain",
    `Plot.distFn({|t: [Date(1500), Date(1600)]| uniform(toYears(t-Date(1500)), 300)})`,
    "distFn",
    (plot) => {
      expect(plot.xScale.method?.type).toBe("date");
      expect(plot.xScale.min).toBe(new Date(1500, 0, 1).getTime());
      expect(plot.xScale.max).toBe(new Date(1600, 0, 1).getTime());
    }
  );

  testPlotResult(
    "explicit scale with min/max ignores the domain",
    `Plot.distFn(
        {|x: [3, 5]| uniform(x, x + 1)},
        {xScale: Scale.linear({ min: 100, max: 200 })}
      )`,
    "distFn",
    (plot) => {
      expect(plot.xScale.method?.type).toBe("linear");
      expect(plot.xScale.min).toBe(100);
      expect(plot.xScale.max).toBe(200);
    }
  );
});
