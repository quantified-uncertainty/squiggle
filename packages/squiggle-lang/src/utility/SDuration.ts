import { BaseDist } from "../dist/BaseDist.js";
import { Env } from "../index.js";
import * as Result from "./result.js";
import { Ok, result } from "./result.js";
import { binaryOperations } from "../dist/distOperations/binaryOperations.js";
import { DistError } from "../dist/DistError.js";
import { Duration, DurationUnit } from "./durationUnit.js";

//This is our own internal date duration class. It's used by the interpreter, but meant to act like a simple date library.
export class SDurationNumber {
  constructor(private ms: number) {
    this.ms = ms;
  }

  static fromMs(f: number): SDurationNumber {
    return new SDurationNumber(f);
  }

  static fromUnit(unit: DurationUnit, value: number): SDurationNumber {
    const inMs = new Duration(value, unit).toUnit("ms").value;
    return SDurationNumber.fromMs(inMs);
  }

  private toDuration(): Duration {
    return new Duration(this.ms, "ms");
  }

  toUnit(unit: DurationUnit): Duration {
    return this.toDuration().toUnit(unit);
  }

  toMs(): number {
    return this.ms;
  }

  toGreatestUnit(): Duration {
    return this.toDuration().toGreatestUnit();
  }

  toString(precision = 2): string {
    return this.toDuration().toGreatestUnit().toString(precision);
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
