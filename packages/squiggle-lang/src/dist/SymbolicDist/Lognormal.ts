import jstat from "jstat";

import * as Operation from "../../operation.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";

type Args = {
  mu: number;
  sigma: number;
};

export class Lognormal extends BaseSymbolicDist<"Lognormal", Args> {
  readonly symbolicType = "Lognormal";

  mu: number;
  sigma: number;

  private constructor({ mu, sigma }: Args) {
    super();
    this.mu = mu;
    this.sigma = sigma;
  }

  static make(args: Args): result<Lognormal, string> {
    if (args.sigma <= 0) {
      return Result.Err("Lognormal standard deviation must be larger than 0");
    }
    return Ok(new Lognormal(args));
  }

  override getArgs() {
    return {
      mu: this.mu,
      sigma: this.sigma,
    };
  }

  toString() {
    return `Lognormal(${this.mu},${this.sigma})`;
  }

  simplePdf(x: number) {
    return jstat.lognormal.pdf(x, this.mu, this.sigma);
  }
  cdf(x: number) {
    return jstat.lognormal.cdf(x, this.mu, this.sigma);
  }
  inv(x: number) {
    return jstat.lognormal.inv(x, this.mu, this.sigma);
  }
  sample() {
    return jstat.lognormal.sample(this.mu, this.sigma);
  }
  mean() {
    return jstat.lognormal.mean(this.mu, this.sigma);
  }
  variance(): Result.result<number, DistError> {
    return Ok(
      (Math.exp(this.sigma * this.sigma) - 1) *
        Math.exp(2 * this.mu + this.sigma * this.sigma)
    );
  }
  _isEqual(other: Lognormal) {
    return this.mu === other.mu && this.sigma === other.sigma;
  }

  static fromCredibleInterval({
    low,
    high,
    probability,
  }: {
    low: number;
    high: number;
    probability: number;
  }): result<Lognormal, string> {
    if (low >= high) {
      return Result.Err("Low value must be less than high value");
    }
    if (low <= 0) {
      return Result.Err("Low value must be above 0");
    }
    if (probability <= 0 || probability >= 1) {
      return Result.Err("Probability must be in (0, 1) interval");
    }

    const logLow = Math.log(low);
    const logHigh = Math.log(high);

    const normalizedSigmas = jstat.normal.inv(1 - (1 - probability) / 2, 0, 1);
    const mu = (logLow + logHigh) / 2;
    const sigma = (logHigh - logLow) / (2 * normalizedSigmas);
    return Lognormal.make({ mu, sigma });
  }

  static fromMeanAndStdev({
    mean,
    stdev,
  }: {
    mean: number;
    stdev: number;
  }): result<Lognormal, string> {
    // https://math.stackexchange.com/questions/2501783/parameters-of-a-lognormal-distribution
    // https://wikiless.org/wiki/Log-normal_distribution?lang=en#Generation_and_parameters
    if (mean <= 0) {
      return Result.Err("Lognormal mean must be larger than 0");
    } else if (stdev <= 0) {
      return Result.Err("Lognormal standard deviation must be larger than 0");
    } else {
      const variance = stdev ** 2;
      const meanSquared = mean ** 2;
      const mu = 2 * Math.log(mean) - 0.5 * Math.log(variance + meanSquared);
      const sigma = Math.sqrt(Math.log(variance / meanSquared + 1));
      return Ok(new Lognormal({ mu, sigma }));
    }
  }

  static multiply(l1: Lognormal, l2: Lognormal) {
    // https://wikiless.org/wiki/Log-normal_distribution?lang=en#Multiplication_and_division_of_independent,_log-normal_random_variables
    const mu = l1.mu + l2.mu;
    const sigma = Math.sqrt(l1.sigma ** 2 + l2.sigma ** 2);
    return new Lognormal({ mu, sigma });
  }
  static divide(l1: Lognormal, l2: Lognormal) {
    const mu = l1.mu - l2.mu;
    // We believe the ratiands will have covariance zero.
    // See here https://stats.stackexchange.com/questions/21735/what-are-the-mean-and-variance-of-the-ratio-of-two-lognormal-variables for details
    const sigma = Math.sqrt(l1.sigma ** 2 + l2.sigma ** 2);
    return new Lognormal({ mu, sigma });
  }

  static operate(
    operation: Operation.AlgebraicOperation,
    n1: Lognormal,
    n2: Lognormal
  ): Lognormal | undefined {
    if (operation === "Multiply") {
      return Lognormal.multiply(n1, n2);
    } else if (operation === "Divide") {
      return Lognormal.divide(n1, n2);
    }
    return undefined;
  }

  static operateFloatFirst(
    operation: Operation.AlgebraicOperation,
    n1: number,
    n2: Lognormal
  ): Lognormal | undefined {
    if (operation === "Multiply") {
      return n1 > 0
        ? new Lognormal({ mu: Math.log(n1) + n2.mu, sigma: n2.sigma })
        : undefined;
    } else if (operation === "Divide") {
      return n1 > 0
        ? new Lognormal({ mu: Math.log(n1) - n2.mu, sigma: n2.sigma })
        : undefined;
    }
    return undefined;
  }

  static operateFloatSecond(
    operation: Operation.AlgebraicOperation,
    n1: Lognormal,
    n2: number
  ) {
    if (operation === "Multiply") {
      return n2 > 0
        ? new Lognormal({ mu: n1.mu + Math.log(n2), sigma: n1.sigma })
        : undefined;
    } else if (operation === "Divide") {
      return n2 > 0
        ? new Lognormal({ mu: n1.mu - Math.log(n2), sigma: n1.sigma })
        : undefined;
    }
    return undefined;
  }
}
