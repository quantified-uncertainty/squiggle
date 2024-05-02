import jstat from "jstat";

import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

export class Exponential extends BaseSymbolicDist<"Exponential", number> {
  readonly symbolicType = "Exponential";

  rate: number;
  private constructor(rate: number) {
    super();
    this.rate = rate;
  }

  static make(rate: number): result<Exponential, string> {
    if (rate <= 0) {
      return Result.Err(
        "Exponential distributions rate must be larger than 0."
      );
    }
    return Ok(new Exponential(rate));
  }

  getArgs() {
    return this.rate;
  }

  toString() {
    return `Exponential(${this.rate})`;
  }

  simplePdf(x: number) {
    return jstat.exponential.pdf(x, this.rate);
  }
  cdf(x: number) {
    return jstat.exponential.cdf(x, this.rate);
  }
  inv(p: number) {
    return jstat.exponential.inv(p, this.rate);
  }
  sample() {
    return jstat.exponential.sample(this.rate);
  }
  mean() {
    return jstat.exponential.mean(this.rate);
  }
  variance(): result<number, DistError> {
    return Ok(jstat.exponential.variance(this.rate));
  }
  _isEqual(other: Exponential) {
    return this.rate === other.rate;
  }
}
