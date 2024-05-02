import jstat from "jstat";

import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

export class Triangular extends BaseSymbolicDist<
  "Triangular",
  {
    low: number;
    medium: number;
    high: number;
  }
> {
  readonly symbolicType = "Triangular";

  low: number;
  medium: number;
  high: number;

  private constructor({
    low,
    medium,
    high,
  }: {
    low: number;
    medium: number;
    high: number;
  }) {
    super();
    this.low = low;
    this.medium = medium;
    this.high = high;
  }

  static make({
    low,
    medium,
    high,
  }: {
    low: number;
    medium: number;
    high: number;
  }): result<Triangular, string> {
    if (low < medium && medium < high) {
      return Ok(new Triangular({ low, medium, high }));
    }
    return Result.Err("Triangular values must be increasing order.");
  }

  toString() {
    return `Triangular(${this.low}, ${this.medium}, ${this.high})`;
  }

  simplePdf(x: number) {
    return jstat.triangular.pdf(x, this.low, this.high, this.medium);
  }
  cdf(x: number) {
    return jstat.triangular.cdf(x, this.low, this.high, this.medium);
  }
  inv(p: number) {
    return jstat.triangular.inv(p, this.low, this.high, this.medium);
  }
  sample() {
    return jstat.triangular.sample(this.low, this.high, this.medium);
  }
  mean() {
    return jstat.triangular.mean(this.low, this.high, this.medium);
  }
  variance(): result<number, DistError> {
    return Ok(jstat.triangular.variance(this.low, this.high, this.medium));
  }
  _isEqual(other: Triangular) {
    return (
      this.low === other.low &&
      this.medium === other.medium &&
      this.high === other.high
    );
  }

  override min() {
    return this.low;
  }
  override max() {
    return this.high;
  }

  override getArgs() {
    return {
      low: this.low,
      medium: this.medium,
      high: this.high,
    };
  }
}
