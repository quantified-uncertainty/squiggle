import { Ok, result } from "./result.js";
import * as Result from "./result.js";

// Stores in Unix milliseconds
export type Duration = number;

// TODO - should we just use date-fns instead? Dates are hard to implement correctly.

enum DurationUnits {
  Second = 1000,
  Minute = 60 * 1000,
  Hour = 60 * 60 * 1000,
  Day = 24 * 60 * 60 * 1000,
  Year = 24 * 60 * 60 * 1000 * 365.25,
}

export const duration = {
  fromFloat: (f: number): Duration => f,
  toFloat: (d: Duration): number => d,

  fromMinutes: (h: number): Duration => h * DurationUnits.Minute,
  fromHours: (h: number): Duration => h * DurationUnits.Hour,
  fromDays: (d: number): Duration => d * DurationUnits.Day,
  fromYears: (y: number): Duration => y * DurationUnits.Year,

  toMinutes: (t: Duration): number => t / DurationUnits.Minute,
  toHours: (t: Duration): number => t / DurationUnits.Hour,
  toDays: (t: Duration): number => t / DurationUnits.Day,
  toYears: (t: Duration): number => t / DurationUnits.Year,

  toString: (duration: Duration): string => {
    const units: [number, string][] = [
      [DurationUnits.Year, "year"],
      [DurationUnits.Day, "day"],
      [DurationUnits.Hour, "hour"],
      [DurationUnits.Minute, "minute"],
      [DurationUnits.Second, "second"],
    ];

    for (const [unitValue, unitName] of units) {
      if (Math.abs(duration) >= unitValue) {
        const value = duration / unitValue;
        const suffix = value !== 1.0 ? "s" : "";
        return `${value.toPrecision(3)} ${unitName}${suffix}`;
      }
    }

    return `${duration.toFixed()} ms`;
  },

  add: (t1: Duration, t2: Duration): Duration => t1 + t2,
  subtract: (t1: Duration, t2: Duration): Duration => t1 - t2,
  multiply: (t1: Duration, t2: number): Duration => t1 * t2,
  divide: (t1: Duration, t2: number): Duration => t1 / t2,
};

export const date = {
  //   //The Rescript/JS implementation of Date is pretty mediocre. It would be good to improve upon later.
  //   let getFullYear = Js.Date.getFullYear
  toString(d: Date): string {
    return d.toDateString();
  },
  fmap(t: Date, fn: (v: number) => number): Date {
    return new Date(fn(t.getTime()));
  },
  subtract(t1: Date, t2: Date): result<Duration, string> {
    const [f1, f2] = [t1.getTime(), t2.getTime()];
    const diff = f1 - f2;
    if (diff < 0) {
      return Result.Err("Cannot subtract a date by one that is in its future");
    } else {
      return Ok(duration.fromFloat(diff));
    }
  },
  addDuration(t: Date, duration: Duration) {
    return date.fmap(t, (t) => t + duration);
  },
  subtractDuration(t: Date, duration: Duration) {
    return date.fmap(t, (t) => t - duration);
  },
  makeWithYearInt(y: number): result<Date, string> {
    if (y < 100) {
      return Result.Err("Year must be over 100");
    } else if (y > 200000) {
      return Result.Err("Year must be less than 200000");
    } else {
      return Ok(new Date(y, 0));
    }
  },
  makeFromYear(year: number): result<Date, string> {
    const floor = Math.floor(year);
    return Result.fmap(date.makeWithYearInt(floor), (earlyDate) => {
      const diff = year - floor;
      return date.addDuration(earlyDate, diff * DurationUnits.Year);
    });
  },
  makeFromString(str: string): result<Date, string> {
    const parsedDate = new Date(str);
    if (isNaN(parsedDate.getTime())) {
      return Result.Err("Invalid date string");
    } else {
      return Ok(parsedDate);
    }
  },
};
