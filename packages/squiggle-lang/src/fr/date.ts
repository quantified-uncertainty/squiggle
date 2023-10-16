import { REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDate,
  frNumber,
  frTimeDuration,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import * as DateTime from "../utility/DateTime.js";
import { vDate, vNumber, vString, vTimeDuration } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "",
  requiresNamespace: false,
});

const makeNumberToDurationFn = (
  name: string,
  fn: (v: number) => DateTime.Duration
) =>
  maker.make({
    name,
    definitions: [makeDefinition([frNumber], ([t]) => vTimeDuration(fn(t)))],
  });

const makeDurationToNumberFn = (
  name: string,
  fn: (v: DateTime.Duration) => number
) =>
  maker.make({
    name,
    definitions: [makeDefinition([frTimeDuration], ([t]) => vNumber(fn(t)))],
  });

export const library = [
  maker.fromDefinition(
    "makeDateFromYear",
    makeDefinition([frNumber], ([year]) => {
      const result = DateTime.Date.makeFromYear(year);
      if (!result.ok) {
        throw new REOther(result.value);
      }
      return vDate(result.value);
    })
  ),
  maker.fromDefinition(
    "dateFromNumber",
    makeDefinition([frNumber], ([f]) => vDate(new Date(f)))
  ),
  maker.fromDefinition(
    "toNumber",
    makeDefinition([frDate], ([f]) => vNumber(f.getTime()))
  ),
  maker.make({
    name: "subtract",
    definitions: [
      makeDefinition([frDate, frTimeDuration], ([d1, d2]) =>
        vDate(DateTime.Date.subtractDuration(d1, d2))
      ),
      makeDefinition([frDate, frDate], ([d1, d2]) => {
        const result = DateTime.Date.subtract(d1, d2);
        if (!result.ok) {
          throw new REOther(result.value);
        }
        return vTimeDuration(result.value);
      }),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        vTimeDuration(DateTime.Duration.subtract(d1, d2))
      ),
    ],
  }),
  maker.make({
    name: "add",
    definitions: [
      makeDefinition([frDate, frTimeDuration], ([d1, d2]) =>
        vDate(DateTime.Date.addDuration(d1, d2))
      ),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        vTimeDuration(DateTime.Duration.add(d1, d2))
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    definitions: [
      makeDefinition([frTimeDuration, frNumber], ([d1, d2]) =>
        vTimeDuration(DateTime.Duration.multiply(d1, d2))
      ),
    ],
  }),
  maker.make({
    name: "divide",
    definitions: [
      makeDefinition([frTimeDuration, frNumber], ([d1, d2]) =>
        vTimeDuration(DateTime.Duration.divide(d1, d2))
      ),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        vNumber(d1 / d2)
      ),
    ],
  }),
  makeNumberToDurationFn("minutes", DateTime.Duration.fromMinutes),
  makeNumberToDurationFn("fromUnit_minutes", DateTime.Duration.fromMinutes),
  makeNumberToDurationFn("hours", DateTime.Duration.fromHours),
  makeNumberToDurationFn("fromUnit_hours", DateTime.Duration.fromHours),
  makeNumberToDurationFn("days", DateTime.Duration.fromDays),
  makeNumberToDurationFn("fromUnit_days", DateTime.Duration.fromDays),
  makeNumberToDurationFn("years", DateTime.Duration.fromYears),
  makeNumberToDurationFn("fromUnit_years", DateTime.Duration.fromYears),
  makeDurationToNumberFn("toMinutes", DateTime.Duration.toMinutes),
  makeDurationToNumberFn("toHours", DateTime.Duration.toHours),
  makeDurationToNumberFn("toDays", DateTime.Duration.toDays),
  makeDurationToNumberFn("toYears", DateTime.Duration.toYears),
];
