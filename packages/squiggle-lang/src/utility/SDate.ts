import { REOther } from "../errors/messages.js";
import { SDuration, durationUnits } from "./SDuration.js";
import { Ok, result, Err } from "./result.js";
import * as Result from "./result.js";

//This is our own internal date class, which is a wrapper around the built-in Date class. It's used by the interpreter, but meant to act like a simple date library.
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
