import * as Result from "../utility/result.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frNumber, frRecord } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vScale } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Scale",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "linear",
    output: "Scale",
    examples: [`Scale.linear({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition(
        "linear",
        [frRecord(["min", frNumber], ["max", frNumber])],
        ([{ min, max }]) => {
          return Result.Ok(
            vScale({
              type: "linear",
              min,
              max,
            })
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "log",
    output: "Scale",
    examples: [`Scale.log({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition(
        "log",
        [frRecord(["min", frNumber], ["max", frNumber])],
        ([{ min, max }]) => {
          return Result.Ok(
            vScale({
              type: "log",
              min,
              max,
            })
          );
        }
      ),
    ],
  }),
];
