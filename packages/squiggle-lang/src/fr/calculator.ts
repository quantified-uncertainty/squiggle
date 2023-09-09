import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frLambda,
  frArray,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vCalculator } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Calculator",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    output: "Calculator",
    examples: [],
    definitions: [
      makeDefinition(
        [frDict(["fn", frLambda], ["rows", frArray(frString)])],
        ([{ fn, rows }]) => {
          return vCalculator({
            fn,
            inputs: rows.map((name) => ({ name })),
          });
        }
      ),
    ],
  }),
];
