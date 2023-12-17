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
            type: "linear",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { type: "linear" };
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
            type: "log",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { type: "log" };
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
            type: "symlog",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            constant: constant ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return {
          type: "symlog",
        };
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
            type: "power",
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            exponent: exponent ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return {
          type: "power",
        };
      }),
    ],
  }),
  maker.make({
    name: "date",
    output: "Scale",
    examples: ["Scale.date({ min: Date(2022), max: Date(2025) })"],
    definitions: [
      makeDefinition(
        [dateDict],
        frScale,
        ([{ min, max, tickFormat, title }]) => {
          checkMinMaxDates(min, max);
          // We don't check the tick format, because the format is much more complicated for dates.
          return {
            type: "date",
            min: min ? min.toMs() : undefined,
            max: max ? max.toMs() : undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], frScale, () => {
        return { type: "date" };
      }),
    ],
  }),
];
