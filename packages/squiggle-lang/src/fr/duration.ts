import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frNumber, frDuration } from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { SDuration } from "../utility/SDuration.js";
import { vNumber, vDuration } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Duration",
  requiresNamespace: false,
});

const makeNumberToDurationFn = (name: string, fn: (v: number) => SDuration) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5)`],
    output: "Duration",
    definitions: [
      makeDefinition([frNumber], frDuration, ([t]) => vDuration(fn(t))),
    ],
  });

const makeDurationToNumberFn = (name: string, fn: (v: SDuration) => number) =>
  maker.make({
    name,
    examples: [`Duration.${name}(5minutes)`],
    output: "Number",
    definitions: [
      makeDefinition([frDuration], frNumber, ([t]) => vNumber(fn(t))),
    ],
  });

export const library = [
  makeNumberToDurationFn("fromMinutes", SDuration.fromMinutes),
  makeNumberToDurationFn("fromHours", SDuration.fromHours),
  makeNumberToDurationFn("fromDays", SDuration.fromDays),
  makeNumberToDurationFn("fromYears", SDuration.fromYears),
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDuration
  ),
  maker.make({
    name: "unaryMinus",
    output: "Duration",
    examples: ["-5minutes"],
    definitions: [
      makeDefinition([frDuration], frDuration, ([d]) =>
        vDuration(d.multiply(-1))
      ),
    ],
  }),
  maker.make({
    name: "add",
    output: "Duration",
    examples: ["5minutes + 10minutes"],
    definitions: [
      makeDefinition([frDuration, frDuration], frDuration, ([d1, d2]) =>
        vDuration(d1.add(d2))
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    output: "Duration",
    examples: ["5minutes - 10minutes"],
    definitions: [
      makeDefinition([frDuration, frDuration], frDuration, ([d1, d2]) =>
        vDuration(d1.subtract(d2))
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    output: "Duration",
    examples: ["5minutes * 10", "10 * 5minutes"],
    definitions: [
      makeDefinition([frDuration, frNumber], frDuration, ([d1, d2]) =>
        vDuration(d1.multiply(d2))
      ),
      makeDefinition([frNumber, frDuration], frDuration, ([d1, d2]) =>
        vDuration(d2.multiply(d1))
      ),
    ],
  }),
  maker.make({
    name: "divide",
    output: "Number",
    examples: ["5minutes / 2minutes"],
    definitions: [
      makeDefinition([frDuration, frDuration], frDuration, ([d1, d2]) =>
        vNumber(d1.divideBySDuration(d2))
      ),
    ],
  }),
  maker.make({
    name: "divide",
    output: "Duration",
    examples: ["5minutes / 3"],
    definitions: [
      makeDefinition([frDuration, frNumber], frDuration, ([d1, d2]) =>
        vDuration(d1.divideByNumber(d2))
      ),
    ],
  }),

  makeNumberToDurationFn("fromUnit_minutes", SDuration.fromMinutes),
  makeNumberToDurationFn("fromUnit_hours", SDuration.fromHours),
  makeNumberToDurationFn("fromUnit_days", SDuration.fromDays),
  makeNumberToDurationFn("fromUnit_years", SDuration.fromYears),

  makeDurationToNumberFn("toMinutes", (d) => d.toMinutes()),
  makeDurationToNumberFn("toHours", (d) => d.toHours()),
  makeDurationToNumberFn("toDays", (d) => d.toDays()),
  makeDurationToNumberFn("toYears", (d) => d.toYears()),
];
