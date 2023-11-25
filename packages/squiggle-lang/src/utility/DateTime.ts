import { REOther } from "../errors/messages.js";
import { Ok, result, Err } from "./result.js";
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

export class SDuration {
  private static durationUnits = {
    Second: 1000,
    Minute: 60 * 1000,
    Hour: 60 * 60 * 1000,
    Day: 24 * 60 * 60 * 1000,
    Year: 24 * 60 * 60 * 1000 * 365.25,
  } as const;

  constructor(private ms: number) {
    this.ms = ms;
  }

  static fromMs(f: number): SDuration {
    return new SDuration(f);
  }

  static fromMinutes(minutes: number): SDuration {
    return new SDuration(minutes * SDuration.durationUnits.Minute);
  }

  static fromHours(hours: number): SDuration {
    return new SDuration(hours * SDuration.durationUnits.Hour);
  }

  static fromDays(days: number): SDuration {
    return new SDuration(days * SDuration.durationUnits.Day);
  }

  static fromYears(years: number): SDuration {
    return new SDuration(years * SDuration.durationUnits.Year);
  }

  toMs(): number {
    return this.ms;
  }

  toMinutes(): number {
    return this.ms / SDuration.durationUnits.Minute;
  }

  toHours(): number {
    return this.ms / SDuration.durationUnits.Hour;
  }

  toDays(): number {
    return this.ms / SDuration.durationUnits.Day;
  }

  toYears(): number {
    return this.ms / SDuration.durationUnits.Year;
  }

  toString(): string {
    const units: [number, string][] = [
      [SDuration.durationUnits.Year, "year"],
      [SDuration.durationUnits.Day, "day"],
      [SDuration.durationUnits.Hour, "hour"],
      [SDuration.durationUnits.Minute, "minute"],
      [SDuration.durationUnits.Second, "second"],
    ];

    for (const [unitValue, unitName] of units) {
      if (Math.abs(this.ms) >= unitValue) {
        const value = this.ms / unitValue;
        const suffix = value !== 1.0 ? "s" : "";
        return `${value.toPrecision(3)} ${unitName}${suffix}`;
      }
    }

    return `${this.ms.toFixed()} ms`;
  }

  add(other: SDuration): SDuration {
    return new SDuration(this.ms + other.ms);
  }

  subtract(other: SDuration): SDuration {
    return new SDuration(this.ms - other.ms);
  }

  divideBySDuration(divisor: SDuration): number {
    return this.ms / divisor.toMs();
  }

  divideByNumber(divisor: number): SDuration {
    return new SDuration(this.ms / divisor);
  }

  //Assumes the passed-in number is unitless
  multiply(num: number): SDuration {
    return SDuration.fromMs(this.toMs() * num);
  }
}

export class SDate {
  constructor(public value: Date) {
    this.value = value;
  }

  private static dateIsValid(date: Date): boolean {
    return date instanceof Date && isFinite(date.getTime());
  }

  static fromString(str: string): result<SDate, string> {
    const parsedDate = new Date(str);
    if (SDate.dateIsValid(parsedDate)) {
      return Ok(new SDate(parsedDate));
    } else {
      return Err("Invalid date string");
    }
  }

  static makeWithYearInt(y: number): result<SDate, string> {
    if (y < 100) {
      return Result.Err("Year must be over 100");
    } else if (y > 200000) {
      return Result.Err("Year must be less than 200000");
    } else {
      return Ok(new SDate(new Date(y, 0)));
    }
  }

  static makeFromYear(year: number): result<SDate, string> {
    const floor = Math.floor(year);
    return Result.fmap(SDate.makeWithYearInt(floor), (earlyDate) => {
      const diff = year - floor;
      return new SDate(earlyDate.value).addDuration(
        SDuration.fromMs(diff * durationUnits.Year)
      );
    });
  }

  static fromMs(ms: number): SDate {
    return new SDate(new Date(ms));
  }

  static fromYearMonthDay(year: number, month: number, day: number): SDate {
    if (month < 1 || month > 12) {
      throw new REOther(`Month must be between 1 and 12, got ${month}`);
    } else if (day < 1 || day > 31) {
      throw new REOther(`Day must be between 1 and 31, got ${day}`);
    }
    return new SDate(new Date(year, month - 1, day));
  }

  static fromUnixS(s: number): SDate {
    return SDate.fromMs(s * 1000);
  }

  static now(): SDate {
    return new SDate(new Date());
  }

  toString(): string {
    return this.value.toDateString();
  }

  toMs(): number {
    return this.value.getTime();
  }

  toUnixS(): number {
    return this.toMs() / 1000;
  }

  toDate(): Date {
    return this.value;
  }

  isEqual(other: SDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  fmap(fn: (v: number) => number): SDate {
    return SDate.fromMs(fn(this.toMs()));
  }

  subtract(other: SDate): result<SDuration, string> {
    const diff = this.toMs() - other.toMs();
    if (diff < 0) {
      return Err("Cannot subtract a date by one that is in its future");
    } else {
      return Ok(new SDuration(diff));
    }
  }

  addDuration(duration: SDuration): SDate {
    return SDate.fromMs(this.toMs() + duration.toMs());
  }

  subtractDuration(duration: SDuration): SDate {
    return SDate.fromMs(this.toMs() - duration.toMs());
  }
}
