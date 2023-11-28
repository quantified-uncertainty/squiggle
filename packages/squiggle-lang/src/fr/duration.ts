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
    definitions: [makeDefinition([frNumber], ([t]) => vDuration(fn(t)))],
  });

const makeDurationToNumberFn = (name: string, fn: (v: SDuration) => number) =>
  maker.make({
    name,
    definitions: [makeDefinition([frDuration], ([t]) => vNumber(fn(t)))],
  });

export const library = [
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDuration
  ),
  maker.make({
    name: "add",
    definitions: [
      makeDefinition([frDuration, frDuration], ([d1, d2]) =>
        vDuration(d1.add(d2))
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    definitions: [
      makeDefinition([frDuration, frDuration], ([d1, d2]) =>
        vDuration(d1.subtract(d2))
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    definitions: [
      makeDefinition([frDuration, frNumber], ([d1, d2]) =>
        vDuration(d1.multiply(d2))
      ),
      makeDefinition([frNumber, frDuration], ([d1, d2]) =>
        vDuration(d2.multiply(d1))
      ),
    ],
  }),
  maker.make({
    name: "divide",
    definitions: [
      makeDefinition([frDuration, frNumber], ([d1, d2]) =>
        vDuration(d1.divideByNumber(d2))
      ),
      makeDefinition([frDuration, frDuration], ([d1, d2]) =>
        vNumber(d1.divideBySDuration(d2))
      ),
    ],
  }),
  makeNumberToDurationFn("minutes", SDuration.fromMinutes),
  makeNumberToDurationFn("fromUnit_minutes", SDuration.fromMinutes),
  makeNumberToDurationFn("hours", SDuration.fromHours),
  makeNumberToDurationFn("fromUnit_hours", SDuration.fromHours),
  makeNumberToDurationFn("days", SDuration.fromDays),
  makeNumberToDurationFn("fromUnit_days", SDuration.fromDays),
  makeNumberToDurationFn("years", SDuration.fromYears),
  makeNumberToDurationFn("fromUnit_years", SDuration.fromYears),

  makeDurationToNumberFn("toMinutes", (d) => d.toMinutes()),
  makeDurationToNumberFn("toHours", (d) => d.toHours()),
  makeDurationToNumberFn("toDays", (d) => d.toDays()),
  makeDurationToNumberFn("toYears", (d) => d.toYears()),
];
