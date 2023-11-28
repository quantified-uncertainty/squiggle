import { BaseDist } from "../dist/BaseDist.js";
import { DistError } from "../dist/DistError.js";
import { PointMass } from "../dist/SymbolicDist.js";
import {
  algebraicSum,
  binaryOperations,
} from "../dist/distOperations/binaryOperations.js";
import { REOther } from "../errors/messages.js";
import { Env } from "../index.js";
import { SDuration, durationUnits } from "./SDuration.js";
import { Ok, result, Err } from "./result.js";
import * as Result from "./result.js";

function isValid(date: Date): boolean {
  return date instanceof Date && isFinite(date.getTime());
}

function makeFromDate(date: Date): SDateNumber {
  return new SDateNumber(date.getTime());
}

function makeWithYearInt(y: number): result<SDateNumber, string> {
  if (y < 100) {
    return Result.Err("Year must be over 100");
  } else if (y > 200000) {
    return Result.Err("Year must be less than 200000");
  } else {
    return Ok(makeFromDate(new Date(y, 0)));
  }
}

//This is our own internal date class, which is a wrapper around the built-in Date class. It's used by the interpreter, but meant to act like a simple date library.
export class SDateNumber {
  constructor(private value: number) {
    this.value = value;
  }

  static fromString(str: string): result<SDateNumber, string> {
    const parsedDate = new Date(str);
    if (isValid(parsedDate)) {
      return Ok(new SDateNumber(parsedDate.getTime()));
    } else {
      return Err("Invalid date string");
    }
  }

  static makeFromYear(year: number): result<SDateNumber, string> {
    const floor = Math.floor(year);
    return Result.fmap(makeWithYearInt(floor), (earlyDate) => {
      const diff = year - floor;
      return new SDateNumber(earlyDate.value).addDuration(
        SDuration.fromMs(diff * durationUnits.Year)
      );
    });
  }

  static fromMs(ms: number): SDateNumber {
    return new SDateNumber(ms);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  static fromYearMonthDay(
    year: number,
    month: number,
    day: number
  ): SDateNumber {
    if (month < 1 || month > 12) {
      throw new REOther(`Month must be between 1 and 12, got ${month}`);
    } else if (day < 1 || day > 31) {
      throw new REOther(`Day must be between 1 and 31, got ${day}`);
    }
    return makeFromDate(new Date(year, month - 1, day));
  }

  static fromUnixS(s: number): SDateNumber {
    return SDateNumber.fromMs(s * 1000);
  }

  static now(): SDateNumber {
    return makeFromDate(new Date());
  }

  toString(): string {
    return this.toDate().toDateString();
  }

  toMs(): number {
    return this.value;
  }

  toUnixS(): number {
    return this.toMs() / 1000;
  }

  isEqual(other: SDateNumber): boolean {
    return this.value === other.value;
  }

  subtract(other: SDateNumber): result<SDuration, string> {
    const diff = this.toMs() - other.toMs();
    if (diff < 0) {
      return Err("Cannot subtract a date by one that is in its future");
    } else {
      return Ok(new SDuration(diff));
    }
  }

  addDuration(duration: SDuration): SDateNumber {
    return SDateNumber.fromMs(this.toMs() + duration.toMs());
  }

  subtractDuration(duration: SDuration): SDateNumber {
    return SDateNumber.fromMs(this.toMs() - duration.toMs());
  }

  smaller(other: SDateNumber): boolean {
    return this.toMs() < other.toMs();
  }

  larger(other: SDateNumber): boolean {
    return this.toMs() > other.toMs();
  }
}

//This is our own internal date class, which is a wrapper around the built-in Date class. It's used by the interpreter, but meant to act like a simple date library.
export class SDate {
  constructor(public value: BaseDist) {
    this.value = value;
  }

  static fromMs(ms: number): SDate {
    return new SDate(new PointMass(ms));
  }

  static fromSDateNumber(date: SDateNumber): SDate {
    return new SDate(new PointMass(date.toMs()));
  }

  static fromUnixS(s: number): SDate {
    return SDate.fromMs(s * 1000);
  }

  static now(): SDate {
    return SDate.fromMs(new Date().getTime());
  }

  toString(): string {
    return this.value.toString();
  }

  toMs(): BaseDist {
    return this.value;
  }

  isEqual(other: SDate): boolean {
    return this.value.isEqual(other.value);
  }

  // toUnixS(): number {
  //   return this.toMs() / 1000;
  // }

  // isEqual(other: SDate): boolean {
  //   return this.value === other.value;
  // }

  fmap(
    fn: (d: BaseDist) => result<BaseDist, DistError>
  ): result<SDate, DistError> {
    const r = fn(this.value);
    if (r.ok) {
      return Ok(new SDate(r.value));
    } else {
      return r;
    }
  }

  addDuration(duration: SDuration, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicAdd(d, new PointMass(duration.toMs()), { env })
    );
  }

  subtractDuration(duration: SDuration, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicSubtract(d, new PointMass(duration.toMs()), {
        env,
      })
    );
  }

  subtract(other: SDate, env: Env): result<SDuration, string> {
    const diff = binaryOperations.algebraicSubtract(this.value, other.value, {
      env,
    });
    return { ok: false, value: "Not implemented" };
  }

  smaller(other: SDate): boolean {
    return this.toMs() < other.toMs();
  }

  larger(other: SDate): boolean {
    return this.toMs() > other.toMs();
  }
}
