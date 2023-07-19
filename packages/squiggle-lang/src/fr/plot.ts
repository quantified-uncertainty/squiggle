import { PointMass } from "../dist/SymbolicDist.js";
import { REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDist,
  frDistOrNumber,
  frLambda,
  frNumber,
  frOptional,
  frRecord,
  frScale,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { LabeledDistribution, Scale, vPlot } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Plot",
  requiresNamespace: true,
});

const defaultScale = { type: "linear" } satisfies Scale;

function fnXScale(fn: Lambda, xScale: Scale | null): Scale {
  if (xScale && xScale.min && xScale.max) {
    // complete scale, nothing to improve
    return xScale;
  }

  const parameters = fn.getParameters();
  if (parameters.length !== 1) {
    throw new REOther(
      `Plots only works with functions that have one parameter. This function has ${parameters.length} parameters.`
    );
  }

  if (xScale) {
    if (xScale.min === undefined && xScale.max !== undefined) {
      throw new REOther(
        "xScale max set without min. Must set either both or neither."
      );
    }
    if (xScale.min !== undefined && xScale.max === undefined) {
      throw new REOther(
        "xScale min set without max. Must set either both or neither."
      );
    }
  }

  /*
   * There are many possible combinations here:
   * 1. xScale with min/max (ignore domain)
   * 2. xScale without min/max, domain defined -> copy min/max from domain
   * 3. xScale without min/max, no domain -> keep xScale
   * 4. no xScale and no domain -> default scale
   */

  const domain = parameters[0].domain;
  if (!domain || domain.value.type !== "NumericRange") {
    // no domain, use explicit scale or default scale
    return xScale ?? defaultScale;
  }

  if (xScale) {
    return {
      ...xScale,
      min: xScale.min ?? domain.value.min,
      max: xScale.max ?? domain.value.max,
    };
  } else {
    return { type: "linear", min: domain.value.min, max: domain.value.max };
  }
}

function verifyOneNumericArgFunction(fn: Lambda) {
  const parameters = fn.getParameters();
  if (parameters.length !== 1) {
    throw new REOther("Expected a function with one parameter");
  }
  // We could also verify a domain here, to be more confident that the function expects numeric args.
  // But we might get other numeric domains besides `NumericRange`, so checking domain type here would be risky.
}

export const library = [
  maker.make({
    name: "dists",
    output: "Plot",
    examples: [
      `Plot.dists({
  dists: [{ name: "dist", value: normal(0, 1) }],
  xScale: Scale.symlog(),
})`,
    ],
    definitions: [
      makeDefinition(
        [
          frRecord(
            [
              "dists",
              frArray(frRecord(["name", frString], ["value", frDistOrNumber])),
            ],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["showSummary", frOptional(frBool)]
          ),
        ],
        ([{ dists, xScale, yScale, title, showSummary }]) => {
          let distributions: LabeledDistribution[] = [];
          dists.forEach(({ name, value }) => {
            if (typeof value === "number") {
              const deltaResult = PointMass.make(value);
              if (deltaResult.ok === false) {
                throw new REOther(deltaResult.value);
              } else {
                distributions.push({ name, distribution: deltaResult.value });
              }
            } else {
              distributions.push({ name, distribution: value });
            }
          });
          return vPlot({
            type: "distributions",
            distributions,
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
            showSummary: showSummary ?? true,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "dist",
    output: "Plot",
    examples: [
      `Plot.dist({
  dist: normal(0, 1),
  xScale: Scale.symlog(),
})`,
    ],
    definitions: [
      makeDefinition(
        [
          frRecord(
            ["dist", frDist],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["title", frOptional(frString)],
            ["showSummary", frOptional(frBool)]
          ),
        ],
        ([{ dist, xScale, yScale, title, showSummary }]) => {
          return vPlot({
            type: "distributions",
            distributions: [{ distribution: dist }],
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
            title: title ?? undefined,
            showSummary: showSummary ?? true,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "numericFn",
    output: "Plot",
    examples: [
      `Plot.numericFn({ fn: {|x|x*x}, xScale: Scale.linear({ min: 3, max: 5 }), yScale: Scale.log({ tickFormat: ".2s" }) })`,
    ],
    definitions: [
      makeDefinition(
        [
          frRecord(
            ["fn", frLambda],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)],
            ["points", frOptional(frNumber)]
          ),
        ],
        ([{ fn, xScale, yScale, points }]) => {
          verifyOneNumericArgFunction(fn);
          return vPlot({
            type: "numericFn",
            fn,
            xScale: fnXScale(fn, xScale),
            yScale: yScale ?? defaultScale,
            points: points ?? undefined,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "distFn",
    output: "Plot",
    examples: [
      `Plot.distFn({ fn: {|x|uniform(x, x+1)}, xScale: Scale.linear({ min: 3, max: 5}), yScale: Scale.log({ tickFormat: ".2s" }) })`,
    ],
    definitions: [
      makeDefinition(
        [
          frRecord(
            ["fn", frLambda],
            ["xScale", frOptional(frScale)],
            ["distXScale", frOptional(frScale)],
            ["points", frOptional(frNumber)]
          ),
        ],
        ([{ fn, xScale, distXScale, points }]) => {
          verifyOneNumericArgFunction(fn);
          return vPlot({
            type: "distFn",
            fn,
            xScale: fnXScale(fn, xScale),
            distXScale: distXScale ?? defaultScale,
            points: points ?? undefined,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "scatter",
    output: "Plot",
    examples: [
      `Plot.scatter({ xDist: 2 to 5, yDist: SampleSet.fromDist(-3 to 3) })`,
      `Plot.scatter({ xDist: 2 to 5, yDist: SampleSet.fromDist(-3 to 3), xScale: Scale.symlog(), yScale: Scale.symlog() })`,
    ],
    definitions: [
      makeDefinition(
        [
          frRecord(
            ["xDist", frDist],
            ["yDist", frDist],
            ["xScale", frOptional(frScale)],
            ["yScale", frOptional(frScale)]
          ),
        ],
        ([{ xDist, yDist, xScale, yScale }]) => {
          return vPlot({
            type: "scatter",
            xDist,
            yDist,
            xScale: xScale ?? defaultScale,
            yScale: yScale ?? defaultScale,
          });
        }
      ),
    ],
  }),
];
