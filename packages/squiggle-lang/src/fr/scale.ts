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
import { REOther } from "../errors/messages.js";

const maker = new FnFactory({
  nameSpace: "Scale",
  requiresNamespace: true,
});

const commonRecord = frRecord(
  ["min", frOptional(frNumber)],
  ["max", frOptional(frNumber)],
  ["tickFormat", frOptional(frString)]
);

function checkMinMax(min: number | null, max: number | null) {
  if (min !== null && max !== null && max <= min) {
    throw new REOther(
      `Max must be greater than min, got: min=${min}, max=${max}`
    );
  }
}

export const library = [
  maker.make({
    name: "linear",
    output: "Scale",
    examples: [`Scale.linear({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition([commonRecord], ([{ min, max, tickFormat }]) => {
        checkMinMax(min, max);

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
      makeDefinition(
        [
          frRecord(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["tickFormat", frOptional(frString)]
          ),
        ],
        ([{ min, max, tickFormat }]) => {
          if (min !== null && min <= 0) {
            throw new REOther(`Min must be over 0 for log scale, got: ${min}`);
          }
          checkMinMax(min, max);
          return vScale({
            type: "log",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
          });
        }
      ),
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
      makeDefinition(
        [
          frRecord(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["tickFormat", frOptional(frString)],
            ["constant", frOptional(frNumber)]
          ),
        ],
        ([{ min, max, tickFormat, constant }]) => {
          checkMinMax(min, max);

          return vScale({
            type: "symlog",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            constant: constant || 0.1,
          });
        }
      ),
      makeDefinition([], () => {
        return vScale({ type: "symlog", constant: 0.1 });
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
            ["exponent", frOptional(frNumber)]
          ),
        ],
        ([{ min, max, tickFormat, exponent }]) => {
          checkMinMax(min, max);

          return vScale({
            type: "power",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            exponent: exponent || 0.1,
          });
        }
      ),
    ],
  }),
];
