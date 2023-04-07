import { PointMass } from "../dist/SymbolicDist.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDistOrNumber,
  frLambda,
  frNumber,
  frRecord,
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
    examples: [`Plot.fn({fn: {|x|x*x}, min: 3, max: 5})`],
    definitions: [
      makeDefinition(
        "fn",
        [frRecord(["fn", frLambda], ["min", frNumber], ["max", frNumber])],
        ([{ fn, min, max }]) => {
          return Result.Ok(
            vPlot({
              type: "fn",
              fn,
              min,
              max,
            })
          );
        }
      ),
    ],
  }),
];
