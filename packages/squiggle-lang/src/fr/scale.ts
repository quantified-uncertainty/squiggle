import { REArgumentError, REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDate,
  frDict,
  frNumber,
  frOptional,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { SDate } from "../utility/DateTime.js";
import { vScale } from "../value/index.js";

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

// Regex taken from d3-format.
// https://github.com/d3/d3-format/blob/f3cb31091df80a08f25afd4a7af2dcb3a6cd5eef/src/formatSpecifier.js#L1C65-L2C85
const d3TickFormatRegex =
  /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

function checkTickFormat(tickFormat: string | null) {
  if (tickFormat && !d3TickFormatRegex.test(tickFormat)) {
    throw new REArgumentError(`Tick format [${tickFormat}] is invalid.`);
  }
}

export const library = [
  maker.make({
    name: "linear",
    output: "Scale",
    examples: [`Scale.linear({ min: 3, max: 10 })`],
    definitions: [
      makeDefinition([commonDict], ([{ min, max, tickFormat, title }]) => {
        checkMinMax(min, max);
        checkTickFormat(tickFormat);
        return vScale({
          type: "linear",
          min: min ?? undefined,
          max: max ?? undefined,
          tickFormat: tickFormat ?? undefined,
          title: title ?? undefined,
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
      makeDefinition([commonDict], ([{ min, max, tickFormat, title }]) => {
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
          title: title ?? undefined,
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
        ([{ min, max, tickFormat, title, constant }]) => {
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
            title: title ?? undefined,
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
            ["title", frOptional(frString)],
            ["exponent", frOptional(frNumber)]
          ),
        ],
        ([{ min, max, tickFormat, title, exponent }]) => {
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
            title: title ?? undefined,
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
  maker.make({
    name: "date",
    output: "Scale",
    examples: [`Scale.date({ min: 2022year, max: 2025year })`],
    definitions: [
      makeDefinition([dateDict], ([{ min, max, tickFormat, title }]) => {
        checkMinMaxDates(min, max);
        // We don't check the tick format, because the format is much more complicated for dates.
        return vScale({
          type: "date",
          min: min ? min.toMs() : undefined,
          max: max ? max.toMs() : undefined,
          tickFormat: tickFormat ?? undefined,
          title: title ?? undefined,
        });
      }),
      makeDefinition([], () => {
        return vScale({ type: "date" });
      }),
    ],
  }),
];
