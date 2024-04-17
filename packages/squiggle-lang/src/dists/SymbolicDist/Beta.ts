import jstat from "jstat";

import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

type Args = {
  alpha: number;
  beta: number;
};

export class Beta extends BaseSymbolicDist<"Beta", Args> {
  readonly symbolicType = "Beta";

  alpha: number;
  beta: number;
  private constructor({ alpha, beta }: Args) {
    super();
    this.alpha = alpha;
    this.beta = beta;
  }

  static make({ alpha, beta }: Args): result<Beta, string> {
    if (alpha > 0 && beta > 0) {
      return Ok(new Beta({ alpha, beta }));
    } else {
      return Result.Err("Beta distribution parameters must be positive");
    }
  }

  override getArgs() {
    return {
      alpha: this.alpha,
      beta: this.beta,
    };
  }

  toString() {
    return `Beta(${this.alpha},${this.beta})`;
  }

  simplePdf(x: number) {
    return jstat.beta.pdf(x, this.alpha, this.beta);
  }

  cdf(x: number) {
    return jstat.beta.cdf(x, this.alpha, this.beta);
  }

  inv(x: number) {
    return jstat.beta.inv(x, this.alpha, this.beta);
  }

  sample() {
    return jstat.beta.sample(this.alpha, this.beta);
  }

  mean() {
    return jstat.beta.mean(this.alpha, this.beta);
  }

  variance(): result<number, DistError> {
    return Ok(jstat.beta.variance(this.alpha, this.beta));
  }

  _isEqual(other: Beta) {
    return this.alpha === other.alpha && this.beta === other.beta;
  }

  static fromMeanAndSampleSize({
    mean,
    sampleSize,
  }: {
    mean: number;
    sampleSize: number;
  }): result<Beta, string> {
    // https://en.wikipedia.org/wiki/Beta_distribution#Mean_and_sample_size
    const alpha = mean * sampleSize;
    const beta = (1 - mean) * sampleSize;
    return Beta.make({ alpha, beta });
  }

  static fromMeanAndStdev({
    mean,
    stdev,
  }: {
    mean: number;
    stdev: number;
  }): result<Beta, string> {
    // https://en.wikipedia.org/wiki/Beta_distribution#Mean_and_variance
    if (!(0 < stdev && stdev <= 0.5)) {
      return Result.Err("Stdev must be in in between 0 and 0.5.");
    } else if (!(0 <= mean && mean <= 1)) {
      return Result.Err("Mean must be in between 0 and 1.0.");
    } else {
      const variance = stdev * stdev;
      const sampleSize = (mean * (1 - mean)) / variance - 1;
      return Beta.fromMeanAndSampleSize({ mean, sampleSize });
    }
  }
}
