import { BaseDist } from "../dist/BaseDist.js";
import { DistError } from "../dist/DistError.js";
import { binaryOperations } from "../dist/distOperations/binaryOperations.js";
import { PointMass } from "../dist/SymbolicDist.js";
import { REOther } from "../errors/messages.js";
import { Env } from "../index.js";
import * as Result from "./result.js";
import { Err, Ok, result } from "./result.js";
import { SDurationDist, SDurationNumber } from "./SDuration.js";

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

  min() {
    return SDateNumber.fromMs(this.value.min());
  }
  max() {
    return SDateNumber.fromMs(this.value.max());
  }
  sample() {
    return SDateNumber.fromMs(this.value.sample());
  }
  sampleN(n: number) {
    return this.value.sampleN(n).map(SDateNumber.fromMs);
  }
  mean() {
    return SDateNumber.fromMs(this.value.mean());
  }
  normalize() {
    return new SDateDist(this.value.normalize());
  }
  isNormalized() {
    return this.value.isNormalized();
  }
  truncate(
    left: SDateNumber | undefined,
    right: SDateNumber | undefined,
    opts?: { env: Env }
  ): result<SDateDist, DistError> {
    return Result.fmap(
      this.value.truncate(left?.toMs(), right?.toMs(), opts),
      (d) => new SDateDist(d)
    );
  }
  //remove PDF because it's confusing under ms domain.
  cdf(x: SDateNumber): number {
    return this.value.cdf(x.toMs());
  }
  inv(x: number): SDateNumber {
    return SDateNumber.fromMs(this.value.inv(x));
  }
  stdev(): result<SDateNumber, DistError> {
    return Result.fmap(this.value.stdev(), SDateNumber.fromMs);
  }
  variance(): result<SDateNumber, DistError> {
    return Result.fmap(this.value.variance(), SDateNumber.fromMs);
  }
  mode(): result<SDateNumber, DistError> {
    return Result.fmap(this.value.mode(), SDateNumber.fromMs);
  }
  toPointSetDist(env: Env): result<SDateDist, DistError> {
    return Result.fmap(this.value.toPointSetDist(env), (d) => new SDateDist(d));
  }

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

  algebraicAddDuration(
    duration: SDurationDist,
    env: Env
  ): result<SDateDist, DistError> {
    return this.fmap((d) =>
      binaryOperations.algebraicAdd(d, duration.toMs(), { env })
    );
  }

  algebraicSubtractDuration(
    duration: SDurationDist,
    env: Env
  ): result<SDateDist, DistError> {
    return this.fmap((d) =>
      binaryOperations.algebraicSubtract(d, duration.toMs(), {
        env,
      })
    );
  }

  algebraicSubtractDate(
    other: SDateDist,
    env: Env
  ): result<SDurationDist, DistError> {
    const diff = binaryOperations.algebraicSubtract(this.value, other.value, {
      env,
    });
    if (diff.ok) {
      return Ok(SDurationDist.fromMs(diff.value));
    } else {
      return diff;
    }
  }
}
