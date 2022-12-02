import * as DateTime from "../utility/DateTime";
import * as Result from "../utility/result";
import { FnFactory } from "../library/registry/helpers";
import { makeDefinition } from "../library/registry/fnDefinition";
import { vDate, vTimeDuration, vNumber, vString } from "../value";
import { Ok } from "../utility/result";
import { frDate, frNumber, frTimeDuration } from "../library/registry/frTypes";
import { REOther } from "../reducer/ErrorMessage";

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
      makeDefinition(name, [frNumber], ([t]) => Ok(vTimeDuration(fn(t)))),
    ],
  });

const makeDurationToNumberFn = (
  name: string,
  fn: (v: DateTime.Duration) => number
) =>
  maker.make({
    name,
    definitions: [
      makeDefinition(name, [frTimeDuration], ([t]) => Ok(vNumber(fn(t)))),
    ],
  });

export const library = [
  maker.fromDefinition(
    makeDefinition("toString", [frDate], ([t]) =>
      Ok(vString(DateTime.Date.toString(t)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("makeDateFromYear", [frNumber], ([year]) => {
      return Result.fmap2(DateTime.Date.makeFromYear(year), vDate, REOther);
    })
  ),
  maker.fromDefinition(
    makeDefinition("dateFromNumber", [frNumber], ([f]) =>
      Ok(vDate(new Date(f)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("toNumber", [frDate], ([f]) => Ok(vNumber(f.getTime())))
  ),
  maker.fromDefinition(
    makeDefinition("subtract", [frDate, frDate], ([d1, d2]) =>
      Result.fmap2(DateTime.Date.subtract(d1, d2), vTimeDuration, REOther)
    )
  ),
  maker.fromDefinition(
    makeDefinition("subtract", [frDate, frTimeDuration], ([d1, d2]) =>
      Ok(vDate(DateTime.Date.subtractDuration(d1, d2)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("add", [frDate, frTimeDuration], ([d1, d2]) =>
      Ok(vDate(DateTime.Date.addDuration(d1, d2)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("toString", [frTimeDuration], ([t]) =>
      Ok(vString(DateTime.Duration.toString(t)))
    )
  ),
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
  maker.fromDefinition(
    makeDefinition("add", [frTimeDuration, frTimeDuration], ([d1, d2]) =>
      Ok(vTimeDuration(DateTime.Duration.add(d1, d2)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("subtract", [frTimeDuration, frTimeDuration], ([d1, d2]) =>
      Ok(vTimeDuration(DateTime.Duration.subtract(d1, d2)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("multiply", [frTimeDuration, frNumber], ([d1, d2]) =>
      Ok(vTimeDuration(DateTime.Duration.multiply(d1, d2)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("divide", [frTimeDuration, frNumber], ([d1, d2]) =>
      Ok(vTimeDuration(DateTime.Duration.divide(d1, d2)))
    )
  ),
  maker.fromDefinition(
    makeDefinition("divide", [frTimeDuration, frTimeDuration], ([d1, d2]) =>
      Ok(vNumber(d1 / d2))
    )
  ),
];
