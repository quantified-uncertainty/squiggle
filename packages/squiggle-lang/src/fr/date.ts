import * as DateTime from "../utility/DateTime.js";
import * as Result from "../utility/result.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { vDate, vTimeDuration, vNumber, vString } from "../value/index.js";
import { Ok } from "../utility/result.js";
import {
  frDate,
  frNumber,
  frTimeDuration,
} from "../library/registry/frTypes.js";
import { REOther } from "../errors.js";

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
    definitions: [
      makeDefinition([frNumber], ([t]) => Ok(vTimeDuration(fn(t)))),
    ],
  });

const makeDurationToNumberFn = (
  name: string,
  fn: (v: DateTime.Duration) => number
) =>
  maker.make({
    name,
    definitions: [
      makeDefinition([frTimeDuration], ([t]) => Ok(vNumber(fn(t)))),
    ],
  });

export const library = [
  maker.make({
    name: "toString",
    definitions: [
      makeDefinition([frDate], ([t]) => Ok(vString(DateTime.Date.toString(t)))),
      makeDefinition([frTimeDuration], ([t]) =>
        Ok(vString(DateTime.Duration.toString(t)))
      ),
    ],
  }),
  maker.fromDefinition(
    "makeDateFromYear",
    makeDefinition([frNumber], ([year]) => {
      return Result.fmap2(
        DateTime.Date.makeFromYear(year),
        vDate,
        (e) => new REOther(e)
      );
    })
  ),
  maker.fromDefinition(
    "dateFromNumber",
    makeDefinition([frNumber], ([f]) => Ok(vDate(new Date(f))))
  ),
  maker.fromDefinition(
    "toNumber",
    makeDefinition([frDate], ([f]) => Ok(vNumber(f.getTime())))
  ),
  maker.make({
    name: "subtract",
    definitions: [
      makeDefinition([frDate, frTimeDuration], ([d1, d2]) =>
        Ok(vDate(DateTime.Date.subtractDuration(d1, d2)))
      ),
      makeDefinition([frDate, frDate], ([d1, d2]) =>
        Result.fmap2(
          DateTime.Date.subtract(d1, d2),
          vTimeDuration,
          (e) => new REOther(e)
        )
      ),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        Ok(vTimeDuration(DateTime.Duration.subtract(d1, d2)))
      ),
    ],
  }),
  maker.make({
    name: "add",
    definitions: [
      makeDefinition([frDate, frTimeDuration], ([d1, d2]) =>
        Ok(vDate(DateTime.Date.addDuration(d1, d2)))
      ),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        Ok(vTimeDuration(DateTime.Duration.add(d1, d2)))
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    definitions: [
      makeDefinition([frTimeDuration, frNumber], ([d1, d2]) =>
        Ok(vTimeDuration(DateTime.Duration.multiply(d1, d2)))
      ),
    ],
  }),
  maker.make({
    name: "divide",
    definitions: [
      makeDefinition([frTimeDuration, frNumber], ([d1, d2]) =>
        Ok(vTimeDuration(DateTime.Duration.divide(d1, d2)))
      ),
      makeDefinition([frTimeDuration, frTimeDuration], ([d1, d2]) =>
        Ok(vNumber(d1 / d2))
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
