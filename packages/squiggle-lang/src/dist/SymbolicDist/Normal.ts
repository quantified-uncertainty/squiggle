import jstat from "jstat";

import { result } from "../../index.js";
import * as Operation from "../../operation.js";
import { Err, Ok } from "../../utility/result.js";
import { DistError } from "../DistError.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";
import { PointMass } from "./PointMass.js";

type Args = {
  mean: number;
  stdev: number;
};

export class Normal extends BaseSymbolicDist<"Normal", Args> {
  readonly symbolicType = "Normal";
  private _mean: number;
  private _stdev: number;

  private constructor({ mean, stdev }: Args) {
    super();
    this._mean = mean;
    this._stdev = stdev;
  }

  static make({ mean, stdev }: Args): result<Normal, string> {
    if (stdev <= 0) {
      return Err(
        "Standard deviation of normal distribution must be larger than 0"
      );
    }
    return Ok(new Normal({ mean, stdev }));
  }

  getArgs() {
    return {
      mean: this._mean,
      stdev: this._stdev,
    };
  }

  toString() {
    return `Normal(${this._mean},${this._stdev})`;
  }

  simplePdf(x: number) {
    return jstat.normal.pdf(x, this._mean, this._stdev);
  }

  cdf(x: number) {
    return jstat.normal.cdf(x, this._mean, this._stdev);
  }

  inv(x: number) {
    return jstat.normal.inv(x, this._mean, this._stdev);
  }

  sample() {
    return jstat.normal.sample(this._mean, this._stdev);
  }

  mean() {
    return jstat.normal.mean(this._mean, this._stdev);
  }

  override stdev(): result<number, DistError> {
    return Ok(this._stdev);
  }
  variance(): result<number, DistError> {
    return Ok(this._stdev ** 2);
  }

  _isEqual(other: Normal) {
    return this._mean === other._mean && this._stdev === other._stdev;
  }

  static fromCredibleInterval({
    low,
    high,
    probability,
  }: {
    low: number;
    high: number;
    probability: number;
  }): result<Normal, string> {
    if (low >= high) {
      return Err("Low value must be less than high value");
    }
    if (probability <= 0 || probability >= 1) {
      return Err("Probability must be in (0, 1) interval");
    }

    // explained in website/docs/internal/ProcessingConfidenceIntervals
    const normalizedSigmas = jstat.normal.inv(1 - (1 - probability) / 2, 0, 1);
    const mean = (low + high) / 2;
    const stdev = (high - low) / (2 * normalizedSigmas);
    return Normal.make({ mean, stdev });
  }

  static add(n1: Normal, n2: Normal) {
    const mean = n1._mean + n2._mean;
    const stdev = Math.sqrt(n1._stdev ** 2 + n2._stdev ** 2);
    return new Normal({ mean, stdev });
  }
  static subtract(n1: Normal, n2: Normal) {
    const mean = n1._mean - n2._mean;
    const stdev = Math.sqrt(n1._stdev ** 2 + n2._stdev ** 2);
    return new Normal({ mean, stdev });
  }

  // // TODO: is this useful here at all? would need the integral as well ...
  // let pointwiseProduct = (n1: t, n2: t) => {
  //   let mean =
  //     (n1.mean *. n2.stdev ** 2. +. n2.mean *. n1.stdev ** 2.) /. (n1.stdev ** 2. +. n2.stdev ** 2.)
  //   let stdev = 1. /. (1. /. n1.stdev ** 2. +. 1. /. n2.stdev ** 2.)
  //   #Normal({mean, stdev})
  // }

  static operate(
    operation: Operation.AlgebraicOperation,
    n1: Normal,
    n2: Normal
  ): Normal | undefined {
    if (operation === "Add") {
      return Normal.add(n1, n2);
    } else if (operation === "Subtract") {
      return Normal.subtract(n1, n2);
    }
    return undefined;
  }

  static operateFloatFirst(
    operation: Operation.AlgebraicOperation,
    n1: number,
    n2: Normal
  ): Normal | PointMass | undefined {
    if (operation === "Add") {
      return new Normal({ mean: n1 + n2._mean, stdev: n2._stdev });
    } else if (operation === "Subtract") {
      return new Normal({ mean: n1 - n2._mean, stdev: n2._stdev });
    } else if (operation === "Multiply") {
      if (n1 === 0) {
        return new PointMass(0);
      }
      return new Normal({
        mean: n1 * n2._mean,
        stdev: Math.abs(n1) * n2._stdev,
      });
    }
    return undefined;
  }

  static operateFloatSecond(
    operation: Operation.AlgebraicOperation,
    n1: Normal,
    n2: number
  ): Normal | PointMass | undefined {
    if (operation === "Add") {
      return new Normal({ mean: n1._mean + n2, stdev: n1._stdev });
    } else if (operation === "Subtract") {
      return new Normal({ mean: n1._mean - n2, stdev: n1._stdev });
    } else if (operation === "Multiply") {
      if (n2 === 0) {
        return new PointMass(0);
      }
      return new Normal({
        mean: n1._mean * n2,
        stdev: n1._stdev * Math.abs(n2),
      });
    } else if (operation === "Divide") {
      return new Normal({
        mean: n1._mean / n2,
        stdev: n1._stdev / Math.abs(n2),
      });
    }
    return undefined;
  }
}
