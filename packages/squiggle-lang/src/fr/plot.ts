import { PointMass } from "../dist/SymbolicDist.js";
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
import { REOther } from "../reducer/ErrorMessage.js";
import * as Result from "../utility/result.js";
import { LabeledDistribution, vPlot } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Plot",
  requiresNamespace: true,
});

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
                return Result.Err(REOther(deltaResult.value));
              } else {
                distributions.push({ name, distribution: deltaResult.value });
              }
            } else {
              distributions.push({ name, distribution: value });
            }
          });
          return Result.Ok(
            vPlot({
              type: "distributions",
              distributions,
              xScale: xScale ?? { type: "linear" },
              yScale: yScale ?? { type: "linear" },
              title: title ?? undefined,
              showSummary: showSummary ?? true,
            })
          );
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
          return Result.Ok(
            vPlot({
              type: "distributions",
              distributions: [{ distribution: dist }],
              xScale: xScale ?? { type: "linear" },
              yScale: yScale ?? { type: "linear" },
              title: title ?? undefined,
              showSummary: showSummary ?? true,
            })
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "numericFn",
    output: "Plot",
    examples: [
      `Plot.numericFn({ fn: {|x|x*x}, xScale: Scale.linear({ min: 3, max: 5}), yScale: Scale.log({ tickFormat: ".2s" }) })`,
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
          return Result.Ok(
            vPlot({
              type: "numericFn",
              fn,
              xScale: xScale ?? { type: "linear" },
              yScale: yScale ?? { type: "linear" },
              points: points ?? undefined,
            })
          );
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
          return Result.Ok(
            vPlot({
              type: "distFn",
              fn,
              xScale: xScale ?? { type: "linear" },
              distXScale: distXScale ?? { type: "linear" },
              points: points ?? undefined,
            })
          );
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
          return Result.Ok(
            vPlot({
              type: "scatter",
              xDist,
              yDist,
              xScale: xScale ?? { type: "linear" },
              yScale: yScale ?? { type: "linear" },
            })
          );
        }
      ),
    ],
  }),
];
