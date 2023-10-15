import { REAmbiguous, REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frNumber,
  frOptional,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vScale } from "../value/index.js";
import { formatSpecifier } from "d3-format";

const maker = new FnFactory({
  nameSpace: "Scale",
  requiresNamespace: true,
});

const commonDict = frDict(
  ["min", frOptional(frNumber)],
  ["max", frOptional(frNumber)],
  ["tickFormat", frOptional(frString)]
);

function checkMinMax(min: number | null, max: number | null) {
  if (min !== null && max !== null && max <= min) {
    throw new REArgumentError(
      `Max must be greater than min, got: min=${min}, max=${max}`
    );
  }
}

function checkTickFormat(tickFormat: string | null) {
  if (tickFormat) {
    try {
      formatSpecifier(tickFormat ?? "");
    } catch (e) {
      throw new REArgumentError(`Tick format [${tickFormat}] is invalid.`);
    }
  }
}

export const library = [
  maker.make({
    name: "linear",
    output: "Scale",
    examples: [`Scale.linear({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition([commonDict], ([{ min, max, tickFormat }]) => {
        checkMinMax(min, max);

        checkTickFormat(tickFormat);
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
          frDict(
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
          checkTickFormat(tickFormat);
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
          frDict(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["tickFormat", frOptional(frString)],
            ["constant", frOptional(frNumber)]
          ),
        ],
        ([{ min, max, tickFormat, constant }]) => {
          checkMinMax(min, max);
          checkTickFormat(tickFormat);
          if (constant !== null && constant === 0) {
            throw new REOther(`Symlog scale constant cannot be 0.`);
          }

          return vScale({
            type: "symlog",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            constant: constant ?? undefined,
          });
        }
      ),
      makeDefinition([], () => {
        return vScale({
          type: "symlog",
        });
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
          frDict(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["tickFormat", frOptional(frString)],
            ["exponent", frOptional(frNumber)]
          ),
        ],
        ([{ min, max, tickFormat, exponent }]) => {
          checkMinMax(min, max);
          checkTickFormat(tickFormat);
          if (exponent !== null && exponent <= 0) {
            throw new REOther(`Power Scale exponent must be over 0.`);
          }

          return vScale({
            type: "power",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            exponent: exponent ?? undefined,
          });
        }
      ),
      makeDefinition([], () => {
        return vScale({
          type: "power",
        });
      }),
    ],
  }),
];
