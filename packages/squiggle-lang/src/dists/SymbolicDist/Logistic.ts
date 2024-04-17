import { PRNG } from "../../rng/index.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

function square(n: number): number {
  return n * n;
}

export class Logistic extends BaseSymbolicDist<
  "Logistic",
  {
    location: number;
    scale: number;
  }
> {
  readonly symbolicType = "Logistic";

  location: number;
  scale: number;
  private constructor({
    location,
    scale,
  }: {
    location: number;
    scale: number;
  }) {
    super();
    this.location = location;
    this.scale = scale;
  }

  static make({
    location,
    scale,
  }: {
    location: number;
    scale: number;
  }): result<Logistic, string> {
    if (scale > 0) {
      return Ok(new Logistic({ location, scale }));
    } else {
      return Result.Err("Scale must be positive");
    }
  }

  toString() {
    return `Logistic(${this.location},${this.scale})`;
  }

  simplePdf(x: number) {
    if (this.scale === 0) return this.location === x ? +Infinity : 0; // should never happen, scale is strictly positive
    const exp_delta = Math.pow(Math.E, -((x - this.location) / this.scale));
    return exp_delta / (this.scale * square(1 + exp_delta));
  }
  cdf(x: number) {
    if (this.scale === 0) return this.location < x ? 0 : 1; // should never happen, scale is strictly positive
    const exp_delta = Math.pow(Math.E, -((x - this.location) / this.scale));
    return 1 / (1 + exp_delta);
  }
  inv(p: number) {
    // p = 0 => Math.log(0) = -Infinity, fine
    // p = 1, scale > 0 => Math.log(Infinity) = Infinity, fine
    // p = 1, scale = 0 => trouble, special case
    if (this.scale === 0) return this.location;
    return this.location + this.scale * Math.log(p / (1 - p));
  }
  sample(rng: PRNG) {
    const s = rng();
    return this.inv(s);
  }
  mean() {
    return this.location;
  }

  variance(): Result.result<number, DistError> {
    return Result.Ok((square(this.scale) * square(Math.PI)) / 3);
  }
  _isEqual(other: Logistic) {
    return this.location === other.location && this.scale === other.scale;
  }

  override getArgs() {
    return {
      location: this.location,
      scale: this.scale,
    };
  }
}
