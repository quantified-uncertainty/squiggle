import { REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDate,
  frDict,
  frNumber,
  frOptional,
  frScale,
  frString,
} from "../library/registry/frTypes.js";
import {
  checkNumericTickFormat,
  FnFactory,
} from "../library/registry/helpers.js";
import { SDate } from "../utility/SDate.js";

const maker = new FnFactory({
  nameSpace: "Scale",
  requiresNamespace: true,
});

const commonDict = frDict(
  ["min", frOptional(frNumber)],
  ["max", frOptional(frNumber)],
  ["tickFormat", frOptional(frString)],
  ["title", frOptional(frString)]
);

const dateDict = frDict(
  ["min", frOptional(frDate)],
  ["max", frOptional(frDate)],
  ["tickFormat", frOptional(frString)],
  ["title", frOptional(frString)]
);

function checkMinMax(min: number | null, max: number | null) {
  if (min !== null && max !== null && max <= min) {
    throw new REArgumentError(
      `Max must be greater than min, got: min=${min}, max=${max}`
    );
  }
}

function checkMinMaxDates(min: SDate | null, max: SDate | null) {
  if (!!min && !!max && max.toMs() <= min.toMs()) {
    throw new REArgumentError(
      `Max must be greater than min, got: min=${min.toString()}, max=${max.toString()}`
    );
  }
}

export const library = [
  maker.make({
    name: "linear",
    output: "Scale",
    examples: [`Scale.linear({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition(
        [commonDict],
        frScale,
        ([{ min, max, tickFormat, title }]) => {
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          return {
            method: { type: "linear" },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { method: { type: "linear" } };
      }),
    ],
  }),
  maker.make({
    name: "log",
    output: "Scale",
    examples: [`Scale.log({ min: 1, max: 100 })`],
    definitions: [
      makeDefinition(
        [commonDict],
        frScale,
        ([{ min, max, tickFormat, title }]) => {
          if (min !== null && min <= 0) {
            throw new REOther(`Min must be over 0 for log scale, got: ${min}`);
          }
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          return {
            method: { type: "log" },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { method: { type: "log" } };
      }),
    ],
  }),
  maker.make({
    name: "symlog",
    output: "Scale",
    examples: [`Scale.symlog({ min: -10, max: 10 })`],
    description: `Symmetric log scale. Useful for plotting data that includes zero or negative values.

The function accepts an additional \`constant\` parameter, used as follows: \`Scale.symlog({constant: 0.1})\`. This parameter allows you to allocate more pixel space to data with lower or higher absolute values. By adjusting this constant, you effectively control the scale's focus, shifting it between smaller and larger values. For more detailed information on this parameter, refer to the [D3 Documentation](https://d3js.org/d3-scale/symlog).
    
The default value for \`constant\` is \`${0.0001}\`.`, // I tried to set this to the default value in the code, but this gave webpack in the Website.
    definitions: [
      makeDefinition(
        [
          frDict(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["tickFormat", frOptional(frString)],
            ["title", frOptional(frString)],
            ["constant", frOptional(frNumber)]
          ),
        ],
        frScale,
        ([{ min, max, tickFormat, title, constant }]) => {
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          if (constant !== null && constant === 0) {
            throw new REOther(`Symlog scale constant cannot be 0.`);
          }

          return {
            method: { type: "symlog", constant: constant ?? undefined },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { method: { type: "symlog" } };
      }),
    ],
  }),
  maker.make({
    name: "power",
    output: "Scale",
    examples: [`Scale.power({ min: 1, max: 100, exponent: 0.1 })`],
    description: `Power scale. Accepts an extra \`exponent\` parameter, like, \`Scale.power({exponent: 2, min: 0, max: 100})\`.

The default value for \`exponent\` is \`${0.1}\`.`,
    definitions: [
      makeDefinition(
        [
          frDict(
            ["min", frOptional(frNumber)],
            ["max", frOptional(frNumber)],
            ["tickFormat", frOptional(frString)],
            ["title", frOptional(frString)],
            ["exponent", frOptional(frNumber)]
          ),
        ],
        frScale,
        ([{ min, max, tickFormat, title, exponent }]) => {
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          if (exponent !== null && exponent <= 0) {
            throw new REOther(`Power Scale exponent must be over 0.`);
          }

          return {
            method: { type: "power", exponent: exponent ?? undefined },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { method: { type: "power" } };
      }),
    ],
  }),
  maker.make({
    name: "date",
    output: "Scale",
    examples: ["Scale.date({ min: Date(2022), max: Date(2025) })"],
    description:
      "Scale for dates. Only works on Date values. Is a linear scale under the hood.",
    definitions: [
      makeDefinition(
        [dateDict],
        frScale,
        ([{ min, max, tickFormat, title }]) => {
          checkMinMaxDates(min, max);
          // We don't check the tick format, because the format is much more complicated for dates.
          return {
            format: { type: "date" },
            min: min ? min.toMs() : undefined,
            max: max ? max.toMs() : undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { method: { type: "date" } };
      }),
    ],
  }),
];
