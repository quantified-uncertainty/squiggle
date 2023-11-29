import { BaseDist } from "../dist/BaseDist.js";
import { Env } from "../index.js";
import * as Result from "./result.js";
import { Ok, result, Err } from "./result.js";
import { binaryOperations } from "../dist/distOperations/binaryOperations.js";
import { DistError } from "../dist/DistError.js";

export const durationUnits = {
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
  Day: 24 * 60 * 60 * 1000,
  Year: 24 * 60 * 60 * 1000 * 365.25,
} as const;

//This is our own internal date duration class. It's used by the interpreter, but meant to act like a simple date library.
export class SDurationNumber {
  constructor(private ms: number) {
    this.ms = ms;
  }

  static fromMs(f: number): SDurationNumber {
    return new SDurationNumber(f);
  }

  static fromMinutes(minutes: number): SDurationNumber {
    return new SDurationNumber(minutes * durationUnits.Minute);
  }

  static fromHours(hours: number): SDurationNumber {
    return new SDurationNumber(hours * durationUnits.Hour);
  }

  static fromDays(days: number): SDurationNumber {
    return new SDurationNumber(days * durationUnits.Day);
  }

  static fromYears(years: number): SDurationNumber {
    return new SDurationNumber(years * durationUnits.Year);
  }

  toMs(): number {
    return this.ms;
  }

  toMinutes(): number {
    return this.ms / durationUnits.Minute;
  }

  toHours(): number {
    return this.ms / durationUnits.Hour;
  }

  toDays(): number {
    return this.ms / durationUnits.Day;
  }

  toYears(): number {
    return this.ms / durationUnits.Year;
  }

  toString(): string {
    const units: [number, string][] = [
      [durationUnits.Year, "year"],
      [durationUnits.Day, "day"],
      [durationUnits.Hour, "hour"],
      [durationUnits.Minute, "minute"],
      [durationUnits.Second, "second"],
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

  add(other: SDurationNumber): SDurationNumber {
    return new SDurationNumber(this.ms + other.ms);
  }

  subtract(other: SDurationNumber): SDurationNumber {
    return new SDurationNumber(this.ms - other.ms);
  }

  divideBySDuration(divisor: SDurationNumber): number {
    return this.ms / divisor.toMs();
  }

  divideByNumber(divisor: number): SDurationNumber {
    return new SDurationNumber(this.ms / divisor);
  }

  //Assumes the passed-in number is unitless
  multiply(num: number): SDurationNumber {
    return SDurationNumber.fromMs(this.toMs() * num);
  }

  isEqual(other: SDurationNumber): boolean {
    return this.ms === other.ms;
  }

  smaller(other: SDurationNumber): boolean {
    return this.ms < other.ms;
  }

  larger(other: SDurationNumber): boolean {
    return this.ms > other.ms;
  }
}

export class SDurationDist {
  constructor(private ms: BaseDist) {
    this.ms = ms;
  }

  static fromMs(f: BaseDist): SDurationDist {
    return new SDurationDist(f);
  }

  toMs(): BaseDist {
    return this.ms;
  }

  toString(): string {
    return "";
  }

  fmap(
    fn: (d: BaseDist) => result<BaseDist, DistError>
  ): result<SDurationDist, DistError> {
    const r = fn(this.ms);
    if (r.ok) {
      return Ok(new SDurationDist(r.value));
    } else {
      return r;
    }
  }

  add(other: SDurationDist, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicAdd(d, other.toMs(), { env })
    );
  }

  subtract(other: SDurationDist, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicSubtract(d, other.toMs(), { env })
    );
  }

  divideBySDuration(
    divisor: SDurationDist,
    env: Env
  ): Result.result<BaseDist, DistError> {
    const foo = this.fmap((d) =>
      binaryOperations.algebraicDivide(d, divisor.toMs(), { env })
    );
    if (foo.ok) {
      return Ok(foo.value.toMs());
    } else {
      return foo;
    }
  }

  divideByNumber(divisor: BaseDist, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicDivide(d, divisor, { env })
    );
  }

  //Assumes the passed-in number is unitless
  multiply(num: BaseDist, env: Env) {
    return this.fmap((d) =>
      binaryOperations.algebraicMultiply(d, num, { env })
    );
  }
}
