import { REOther } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDate,
  frNumber,
  frString,
  frTimeDuration,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { type Duration, duration, SDate } from "../utility/DateTime.js";
import { vDate, vNumber, vTimeDuration } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Date",
  requiresNamespace: false,
});

const makeNumberToDurationFn = (name: string, fn: (v: number) => Duration) =>
  maker.make({
    name,
    definitions: [makeDefinition([frNumber], ([t]) => vTimeDuration(fn(t)))],
  });

const makeYearFn = makeDefinition([frNumber], ([year]) => {
  const result = SDate.makeFromYear(year);
  if (!result.ok) {
    throw new REOther(result.value);
  }
  return vDate(result.value);
});

const makeDurationToNumberFn = (name: string, fn: (v: Duration) => number) =>
  maker.make({
    name,
    definitions: [makeDefinition([frTimeDuration], ([t]) => vNumber(fn(t)))],
  });

export const library = [
  maker.make({
    name: "make",
    requiresNamespace: true,
    examples: ['Date.make("2020-05-12")', "Date.make(2020, 5, 10)"],
    definitions: [
      makeDefinition([frString], ([str]) => {
        const result = SDate.fromString(str);
        if (!result.ok) {
          throw new REOther(result.value);
        }
        return vDate(result.value);
      }),

      makeDefinition([frNumber, frNumber, frNumber], ([yr, month, date]) => {
        return vDate(new SDate(new Date(yr, month - 1, date)));
      }),
    ],
  }),
  // same name as used in date-fns
  maker.make({
    name: "fromUnixTime",
    requiresNamespace: true,
    definitions: [
      makeDefinition([frNumber], ([num]) => {
        return vDate(SDate.fromUnixS(num));
      }),
    ],
  }),
  maker.make({
    name: "toUnixTime",
    requiresNamespace: true,
    definitions: [
      makeDefinition([frDate], ([date]) => {
        return vNumber(date.toUnixS());
      }),
    ],
  }),
  maker.fromDefinition("year", makeYearFn),
  maker.fromDefinition("fromUnit_year", makeYearFn),
  maker.make({
    name: "subtract",
    definitions: [
      makeDefinition([frDate, frTimeDuration], ([d1, d2]) =>
        vDate(d1.subtractDuration(d2))
      ),
      makeDefinition([frDate, frDate], ([d1, d2]) => {
        const result = d1.subtract(d2);
        if (!result.ok) {
          throw new REOther(result.value);
        }
        return vTimeDuration(result.value);
      }),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        vTimeDuration(duration.subtract(d1, d2))
      ),
    ],
  }),
  maker.make({
    name: "add",
    definitions: [
      makeDefinition([frDate, frTimeDuration], ([d1, d2]) =>
        vDate(d1.addDuration(d2))
      ),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        vTimeDuration(duration.add(d1, d2))
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    definitions: [
      makeDefinition([frTimeDuration, frNumber], ([d1, d2]) =>
        vTimeDuration(duration.multiply(d1, d2))
      ),
    ],
  }),
  maker.make({
    name: "divide",
    definitions: [
      makeDefinition([frTimeDuration, frNumber], ([d1, d2]) =>
        vTimeDuration(duration.divide(d1, d2))
      ),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        vNumber(d1 / d2)
      ),
    ],
  }),
  makeNumberToDurationFn("minutes", duration.fromMinutes),
  makeNumberToDurationFn("fromUnit_minutes", duration.fromMinutes),
  makeNumberToDurationFn("hours", duration.fromHours),
  makeNumberToDurationFn("fromUnit_hours", duration.fromHours),
  makeNumberToDurationFn("days", duration.fromDays),
  makeNumberToDurationFn("fromUnit_days", duration.fromDays),
  makeNumberToDurationFn("years", duration.fromYears),
  makeNumberToDurationFn("fromUnit_years", duration.fromYears),
  makeNumberToDurationFn("fromUnit_years", duration.fromYears),
  makeDurationToNumberFn("toMinutes", duration.toMinutes),
  makeDurationToNumberFn("toHours", duration.toHours),
  makeDurationToNumberFn("toDays", duration.toDays),
  makeDurationToNumberFn("toYears", duration.toYears),
];
