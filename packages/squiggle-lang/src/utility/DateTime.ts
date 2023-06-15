import { Ok, result } from "./result.js";
import * as Result from "./result.js";

// Stores in Unix milliseconds
export type Duration = number;

// TODO - should we just use date-fns instead? Dates are hard to implement correctly.

export const Duration = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  year: 24 * 60 * 60 * 1000 * 365.25,
  fromFloat: (f: number): Duration => f,
  toFloat: (d: Duration): number => d,
  fromMinutes: (h: number): Duration => h * Duration.minute,
  fromHours: (h: number): Duration => h * Duration.hour,
  fromDays: (d: number): Duration => d * Duration.day,
  fromYears: (y: number): Duration => y * Duration.year,
  toMinutes: (t: Duration): number => t / Duration.minute,
  toHours: (t: Duration): number => t / Duration.hour,
  toDays: (t: Duration): number => t / Duration.day,
  toYears: (t: Duration): number => t / Duration.year,
  toString(t: number): string {
    const shouldPluralize = (f: number) => f !== 1.0;
    const display = (f: number, s: string) =>
      `${f.toPrecision(3)} ${s}${shouldPluralize(f) ? "s" : ""}`;
    const abs = Math.abs(t);
    if (abs >= Duration.year) {
      return display(t / Duration.year, "year");
    } else if (abs >= Duration.day) {
      return display(t / Duration.day, "day");
    } else if (abs >= Duration.hour) {
      return display(t / Duration.hour, "hour");
    } else if (abs >= Duration.minute) {
      return display(t / Duration.minute, "minute");
    } else {
      return t.toFixed() + "ms";
    }
  },
  add: (t1: Duration, t2: Duration): Duration => t1 + t2,
  subtract: (t1: Duration, t2: Duration): Duration => t1 - t2,
  multiply: (t1: Duration, t2: number): Duration => t1 * t2,
  divide: (t1: Duration, t2: number): Duration => t1 / t2,
};

export const DateModule = {
  //   //The Rescript/JS implementation of Date is pretty mediocre. It would be good to improve upon later.
  //   let getFullYear = Js.Date.getFullYear
  toString(d: Date) {
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
      return Ok(Duration.fromFloat(diff));
    }
  },
  addDuration(t: Date, duration: Duration) {
    return DateModule.fmap(t, (t) => t + duration);
  },
  subtractDuration(t: Date, duration: Duration) {
    return DateModule.fmap(t, (t) => t - duration);
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
    return Result.fmap(DateModule.makeWithYearInt(floor), (earlyDate) => {
      const diff = year - floor;
      return DateModule.addDuration(earlyDate, diff * Duration.year);
    });
  },
};

export { DateModule as Date };
