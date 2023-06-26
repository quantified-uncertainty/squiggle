import * as Result from "../utility/result.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frNumber,
  frOptional,
  frRecord,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vScale } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Scale",
  requiresNamespace: true,
});

const commonRecord = frRecord(
  ["min", frOptional(frNumber)],
  ["max", frOptional(frNumber)],
  ["tickFormat", frOptional(frString)]
);

export const library = [
  maker.make({
    name: "linear",
    output: "Scale",
    examples: [`Scale.linear({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition([commonRecord], ([{ min, max, tickFormat }]) => {
        return vScale({
          type: "linear",
          min: min ?? undefined,
          max: max ?? undefined,
          tickFormat: tickFormat ?? undefined,
        });
      }),
      makeDefinition([], () => {
        return vScale({ type: "linear" });
      }),
    ],
  }),
  maker.make({
    name: "log",
    output: "Scale",
    examples: [`Scale.log({ min: 1, max: 100 })`],
    definitions: [
      makeDefinition([commonRecord], ([{ min, max, tickFormat }]) => {
        // TODO - check that min > 0?
        return vScale({
          type: "log",
          min: min ?? undefined,
          max: max ?? undefined,
          tickFormat: tickFormat ?? undefined,
        });
      }),
      makeDefinition([], () => {
        return vScale({ type: "log" });
      }),
    ],
  }),
  maker.make({
    name: "symlog",
    output: "Scale",
    examples: [`Scale.symlog({ min: -10, max: 10 })`],
    definitions: [
      makeDefinition([commonRecord], ([{ min, max, tickFormat }]) => {
        return vScale({
          type: "symlog",
          min: min ?? undefined,
          max: max ?? undefined,
          tickFormat: tickFormat ?? undefined,
        });
      }),
      makeDefinition([], () => {
        return vScale({ type: "symlog" });
      }),
    ],
  }),
  maker.make({
    name: "power",
    output: "Scale",
    examples: [`Scale.power({ min: 1, max: 100, exponent: 0.1 })`],
    definitions: [
      makeDefinition(
        [
          frRecord(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["tickFormat", frOptional(frString)],
            ["exponent", frNumber]
          ),
        ],
        ([{ min, max, tickFormat, exponent }]) => {
          return vScale({
            type: "power",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            exponent,
          });
        }
      ),
    ],
  }),
];
