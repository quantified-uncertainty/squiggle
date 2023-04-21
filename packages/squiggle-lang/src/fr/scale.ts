import * as Result from "../utility/result.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frNumber, frOptional, frRecord } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vScale } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Scale",
  requiresNamespace: true,
});

const minMaxRecord = frRecord(
  ["min", frOptional(frNumber)],
  ["max", frOptional(frNumber)]
);

export const library = [
  maker.make({
    name: "linear",
    output: "Scale",
    examples: [`Scale.linear({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition("linear", [minMaxRecord], ([{ min, max }]) => {
        return Result.Ok(
          vScale({
            type: "linear",
            min: min ?? undefined,
            max: max ?? undefined,
          })
        );
      }),
      makeDefinition("linear", [], () => {
        return Result.Ok(vScale({ type: "linear" }));
      }),
    ],
  }),
  maker.make({
    name: "log",
    output: "Scale",
    examples: [`Scale.log({ min: 1, max: 100 })`],
    definitions: [
      makeDefinition("log", [minMaxRecord], ([{ min, max }]) => {
        // TODO - check that min > 0?
        return Result.Ok(
          vScale({
            type: "log",
            min: min ?? undefined,
            max: max ?? undefined,
          })
        );
      }),
      makeDefinition("log", [], () => {
        return Result.Ok(vScale({ type: "log" }));
      }),
    ],
  }),
  maker.make({
    name: "symlog",
    output: "Scale",
    examples: [`Scale.symlog({ min: -10, max: 10 })`],
    definitions: [
      makeDefinition("symlog", [minMaxRecord], ([{ min, max }]) => {
        return Result.Ok(
          vScale({
            type: "symlog",
            min: min ?? undefined,
            max: max ?? undefined,
          })
        );
      }),
      makeDefinition("symlog", [], () => {
        return Result.Ok(vScale({ type: "symlog" }));
      }),
    ],
  }),
  maker.make({
    name: "power",
    output: "Scale",
    examples: [`Scale.power({ min: 1, max: 100, exponent: 0.1 })`],
    definitions: [
      makeDefinition(
        "power",
        [
          frRecord(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["exponent", frNumber]
          ),
        ],
        ([{ min, max, exponent }]) => {
          return Result.Ok(
            vScale({
              type: "power",
              min: min ?? undefined,
              max: max ?? undefined,
              exponent,
            })
          );
        }
      ),
    ],
  }),
];
