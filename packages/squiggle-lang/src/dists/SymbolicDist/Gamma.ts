import jstat from "jstat";

import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

type Args = {
  shape: number;
  scale: number;
};

export class Gamma extends BaseSymbolicDist<"Gamma", Args> {
  readonly symbolicType = "Gamma";
  shape: number;
  scale: number;
  private constructor({ shape, scale }: Args) {
    super();
    this.shape = shape;
    this.scale = scale;
  }

  static make({ shape, scale }: Args): result<Gamma, string> {
    if (shape <= 0) {
      return Result.Err("shape must be larger than 0");
    }
    if (scale <= 0) {
      return Result.Err("scale must be larger than 0");
    }
    return Ok(new Gamma({ shape, scale }));
  }

  getArgs() {
    return {
      shape: this.shape,
      scale: this.scale,
    };
  }

  toString() {
    return `(${this.shape}, ${this.scale})`;
  }

  simplePdf(x: number) {
    return jstat.gamma.pdf(x, this.shape, this.scale);
  }
  cdf(x: number) {
    return jstat.gamma.cdf(x, this.shape, this.scale);
  }
  inv(x: number) {
    return jstat.gamma.inv(x, this.shape, this.scale);
  }
  sample() {
    return jstat.gamma.sample(this.shape, this.scale);
  }
  mean() {
    return jstat.gamma.mean(this.shape, this.scale);
  }
  variance(): Result.result<number, DistError> {
    return Ok(this.shape * this.scale * this.scale);
  }
  _isEqual(other: Gamma) {
    return this.shape === other.shape && this.scale === other.scale;
  }
}
