import { PointMass } from "../dist/SymbolicDist.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
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
    examples: [`Plot.dists({dists: [{name: "dist", value: normal(0, 1)}]})`],
    definitions: [
      makeDefinition(
        "dists",
        [
          frRecord([
            "dists",
            frArray(frRecord(["name", frString], ["value", frDistOrNumber])),
          ]),
        ],
        ([{ dists }]) => {
          let distributions: LabeledDistribution[] = [];
          dists.forEach(({ name, value }) => {
            if (typeof value === "number") {
              const deltaResult = PointMass.make(value);
              if (deltaResult.ok === false) {
                return Result.Error(REOther(deltaResult.value));
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
            })
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "fn",
    output: "Plot",
    examples: [
      `Plot.fn({fn: {|x|x*x}, xScale: Scale.linear({ min: 3, max: 5}) })`,
    ],
    definitions: [
      makeDefinition(
        "fn",
        [
          frRecord(
            ["fn", frLambda],
            ["xScale", frOptional(frScale)],
            ["points", frOptional(frNumber)]
          ),
        ],
        ([{ fn, xScale, points }]) => {
          return Result.Ok(
            vPlot({
              type: "fn",
              fn,
              xScale: xScale ?? { type: "linear" },
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
    ],
    definitions: [
      makeDefinition(
        "scatter",
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
