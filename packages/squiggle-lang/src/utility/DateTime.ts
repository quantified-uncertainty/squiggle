import { Ok, result } from "./result.js";
import * as Result from "./result.js";

// Stores in Unix milliseconds
export type Duration = number;

// TODO - should we just use date-fns instead? Dates are hard to implement correctly.

const durationUnits = {
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
  Day: 24 * 60 * 60 * 1000,
  Year: 24 * 60 * 60 * 1000 * 365.25,
} as const;

export const duration = {
  fromFloat: (f: number): Duration => f,
  toFloat: (d: Duration): number => d,

  fromMinutes: (h: number): Duration => h * durationUnits.Minute,
  fromHours: (h: number): Duration => h * durationUnits.Hour,
  fromDays: (d: number): Duration => d * durationUnits.Day,
  fromYears: (y: number): Duration => y * durationUnits.Year,

  toMinutes: (t: Duration): number => t / durationUnits.Minute,
  toHours: (t: Duration): number => t / durationUnits.Hour,
  toDays: (t: Duration): number => t / durationUnits.Day,
  toYears: (t: Duration): number => t / durationUnits.Year,

  toString: (duration: Duration): string => {
    const units: [number, string][] = [
      [durationUnits.Year, "year"],
      [durationUnits.Day, "day"],
      [durationUnits.Hour, "hour"],
      [durationUnits.Minute, "minute"],
      [durationUnits.Second, "second"],
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

export function dateFromString(str: string): result<Date, string> {
  const parsedDate = new Date(str);
  if (dateIsValid(parsedDate)) {
    return Ok(parsedDate);
  } else {
    return Result.Err("Invalid date string");
  }
}

export function dateFromMs(ms: number): Date {
  return new Date(ms);
}

export function dateToMs(date: Date): number {
  return date.getTime();
}

export function dateToUnixS(date: Date): number {
  return dateToMs(date) / 1000;
}

export function dateFromUnixS(s: number): Date {
  return dateFromMs(s * 1000);
}

export function dateIsValid(date: Date) {
  return date instanceof Date && isFinite(date.getTime());
}

export function dateToString(date: Date): string {
  return date.toDateString();
}

export function dateFromMsToString(ms: number): string {
  return dateToString(dateFromMs(ms));
}

export const date = {
  fmap(t: Date, fn: (v: number) => number): Date {
    return dateFromMs(fn(dateToMs(t)));
  },
  subtract(t1: Date, t2: Date): result<Duration, string> {
    const [f1, f2] = [dateToMs(t1), dateToMs(t2)];
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
      return date.addDuration(earlyDate, diff * durationUnits.Year);
    });
  },
};
