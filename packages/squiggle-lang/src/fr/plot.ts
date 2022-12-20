import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frArray,
  frString,
  frRecord,
  frDistOrNumber,
} from "../library/registry/frTypes";
import { Float } from "../dist/SymbolicDist";
import { FnFactory } from "../library/registry/helpers";
import * as Result from "../utility/result";
import { vPlot, LabeledDistribution } from "../value";
import { REOther } from "../reducer/ErrorMessage";

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
              const deltaResult = Float.make(value);
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
              distributions,
            })
          );
        }
      ),
    ],
  }),
];
