import { BaseDist } from "../dist/BaseDist.js";
import { DistError } from "../dist/DistError.js";
import { PointMass } from "../dist/SymbolicDist.js";
import { binaryOperations } from "../dist/distOperations/binaryOperations.js";
import { REOther } from "../errors/messages.js";
import { Env } from "../index.js";
import { SDurationDist, SDurationNumber } from "./SDuration.js";
import { Ok, result, Err } from "./result.js";
import * as Result from "./result.js";

function isValid(date: Date): boolean {
  return date instanceof Date && isFinite(date.getTime());
}

function makeFromDate(date: Date): SDateNumber {
  return SDateNumber.fromMs(date.getTime());
}

function makeWithYearInt(y: number): result<Date, string> {
  if (y < 100) {
    return Result.Err("Year must be over 100");
  } else if (y > 200000) {
    return Result.Err("Year must be less than 200000");
  } else {
    // return Ok(makeFromDate(new Date(y, 0)));
    return Ok(new Date(y, 0));
  }
}

//This is our own internal date class, which is a wrapper around the built-in Date class. It's used by the interpreter, but meant to act like a simple date library.
export class SDateNumber {
  private constructor(public value: number) {}

  static fromString(str: string): result<SDateNumber, string> {
    const parsedDate = new Date(str);
    if (isValid(parsedDate)) {
      return Ok(new SDateNumber(parsedDate.getTime()));
    } else {
      return Err("Invalid date string");
    }
  }

  static fromYear(year: number): result<SDateNumber, string> {
    const floor = Math.floor(year);
    return Result.fmap(makeWithYearInt(floor), (earlyDate) => {
      const diff = year - floor;
      return new SDateNumber(earlyDate.getTime()).addDuration(
        SDurationNumber.fromUnit("year", diff)
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

  addDuration(duration: SDurationNumber): SDateNumber {
    return SDateNumber.fromMs(this.toMs() + duration.toMs());
  }

  subtractDuration(duration: SDurationNumber): SDateNumber {
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
export class SDateDist {
  constructor(public value: BaseDist) {
    this.value = value;
  }

  static fromMs(ms: number): SDateDist {
    return new SDateDist(new PointMass(ms));
  }

  static fromMsDist(ms: BaseDist): SDateDist {
    return new SDateDist(ms);
  }

  static fromSDateNumber(date: SDateNumber): SDateDist {
    return new SDateDist(new PointMass(date.toMs()));
  }

  static fromUnixS(s: number): SDateDist {
    return SDateDist.fromMs(s * 1000);
  }

  static now(): SDateDist {
    return SDateDist.fromMs(new Date().getTime());
  }

  toString(): string {
    return this.value.toString();
  }

  toMs(): BaseDist {
    return this.value;
  }

  isEqual(other: SDateDist): boolean {
    return this.value.isEqual(other.value);
  }

  // toUnixS(): number {
  //   return this.toMs() / 1000;
  // }

  // isEqual(other: SDateDist): boolean {
  //   return this.value === other.value;
  // }

  fmap(
    fn: (d: BaseDist) => result<BaseDist, DistError>
  ): result<SDateDist, DistError> {
    const r = fn(this.value);
    if (r.ok) {
      return Ok(new SDateDist(r.value));
    } else {
      return r;
    }
  }

  addDuration(duration: SDurationDist, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicAdd(d, duration.toMs(), { env })
    );
  }

  subtractDuration(duration: SDurationDist, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicSubtract(d, duration.toMs(), {
        env,
      })
    );
  }

  subtract(other: SDateDist, env: Env): result<SDurationDist, DistError> {
    const diff = binaryOperations.algebraicSubtract(this.value, other.value, {
      env,
    });
    if (diff.ok) {
      return Ok(SDurationDist.fromMs(diff.value));
    } else {
      return diff;
    }
  }

  smaller(other: SDateDist): boolean {
    return this.toMs() < other.toMs();
  }

  larger(other: SDateDist): boolean {
    return this.toMs() > other.toMs();
  }
}
