import jstat from "jstat";

import * as magicNumbers from "../../magicNumbers.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { Env } from "../env.js";
import { BaseSymbolicDist, PointsetXSelection } from "./BaseSymbolicDist.js";

export class Uniform extends BaseSymbolicDist<
  "Uniform",
  {
    low: number;
    high: number;
  }
> {
  readonly symbolicType = "Uniform";
  low: number;
  high: number;
  private constructor({ low, high }: { low: number; high: number }) {
    super();
    this.high = high;
    this.low = low;
  }

  static make({
    low,
    high,
  }: {
    low: number;
    high: number;
  }): result<Uniform, string> {
    if (high > low) {
      return Ok(new Uniform({ low, high }));
    } else {
      return Result.Err("High must be larger than low");
    }
  }

  protected override interpolateXs(opts: {
    xSelection: PointsetXSelection;
    points: number;
    env: Env;
  }): number[] {
    if (opts.xSelection === "ByWeight") {
      // In `ByWeight mode, uniform distributions get special treatment because we need two x's
      // on either side for proper rendering (just left and right of the discontinuities).
      const distance = this.high - this.low;
      const dx = magicNumbers.Epsilon.ten * distance;
      return [
        this.low - dx,
        this.low,
        this.low + dx,
        this.high - dx,
        this.high,
        this.high + dx,
      ];
    }
    return super.interpolateXs(opts);
  }
  toString() {
    return `Uniform(${this.low},${this.high})`;
  }

  simplePdf(x: number) {
    return jstat.uniform.pdf(x, this.low, this.high);
  }
  cdf(x: number) {
    return jstat.uniform.cdf(x, this.low, this.high);
  }
  inv(x: number) {
    return jstat.uniform.inv(x, this.low, this.high);
  }
  sample() {
    return jstat.uniform.sample(this.low, this.high);
  }
  mean() {
    return jstat.uniform.mean(this.low, this.high);
  }
  variance(): result<number, DistError> {
    return Ok(Math.pow(this.high - this.low, 2) / 12);
  }
  _isEqual(other: Uniform) {
    return this.low === other.low && this.high === other.high;
  }

  override min() {
    return this.low;
  }
  override max() {
    return this.high;
  }

  override truncate(
    left: number | undefined,
    right: number | undefined
  ): result<Uniform, DistError> {
    //todo: add check
    const newLow = Math.max(left ?? -Infinity, this.low);
    const newHigh = Math.min(right ?? Infinity, this.high);
    return Ok(new Uniform({ low: newLow, high: newHigh }));
  }

  override getArgs() {
    return {
      low: this.low,
      high: this.high,
    };
  }
}
