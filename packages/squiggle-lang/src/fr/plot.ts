import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frArray,
  frString,
  frRecord,
  frDistOrNumber,
} from "../library/registry/frTypes";
import { Float } from "../dist/SymbolicDist";
import { FnFactory } from "../library/registry/helpers";
import { result, Ok, sequence, fmap, errMap } from "../utility/result";
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
    examples: [`Plot.dists({show: [{name: "dist", value: normal(0, 1)}]})`],
    definitions: [
      makeDefinition(
        "dists",
        [
          frRecord([
            "show",
            frArray(frRecord(["name", frString], ["value", frDistOrNumber])),
          ]),
        ],
        ([{ show }]) => {
          let distributionResult: result<LabeledDistribution, string>[] =
            show.map(({ name, value }) =>
              fmap(
                typeof value === "number" ? Float.make(value) : Ok(value),
                (distribution) => ({ name, distribution, opacity: 0.3 })
              )
            );
          let distributionResultMapped = errMap(
            sequence(distributionResult),
            (errMessage) => REOther(errMessage)
          );
          return fmap(distributionResultMapped, (distributions) =>
            vPlot({
              distributions,
              showLegend: true,
              colorScheme: "category10",
            })
          );
        }
      ),
    ],
  }),
];
