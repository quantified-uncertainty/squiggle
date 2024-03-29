import * as magicNumbers from "../magicNumbers.js";
import { PRNG } from "../rng/index.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { DistError, notYetImplemented } from "./DistError.js";
import { Env } from "./env.js";
import { PointSetDist } from "./PointSetDist.js";

export abstract class BaseDist {
  abstract type: string;
  abstract min(): number;
  abstract max(): number;
  abstract mean(): number;

  abstract sample(rng: PRNG): number;
  abstract sampleN(n: number, rng: PRNG): number[];

  abstract normalize(): BaseDist;
  isNormalized(): boolean {
    return Math.abs(this.integralSum() - 1) < 1e-7;
  }

  abstract truncate(
    left: number | undefined,
    right: number | undefined,
    opts: { env: Env; rng: PRNG } // `env` is needed for symbolic dists, and `rng` for sample set dists
  ): result<BaseDist, DistError>;

  abstract integralSum(): number;

  abstract pdf(x: number, opts: { env: Env }): result<number, DistError>;
  abstract cdf(x: number): number;
  abstract inv(x: number): number;

  stdev(): result<number, DistError> {
    return Result.fmap(this.variance(), Math.sqrt);
  }
  abstract variance(): result<number, DistError>;
  protected abstract _isEqual(b: BaseDist): boolean;

  isEqual(b: BaseDist): boolean {
    return this.constructor === b.constructor && this._isEqual(b);
  }

  mode(): result<number, DistError> {
    return Result.Err(notYetImplemented());
  }

  abstract toPointSetDist(env: Env): result<PointSetDist, DistError>;
  abstract toSparkline(
    bucketCount: number,
    env: Env
  ): result<string, DistError>;

  expectedConvolutionCost() {
    return magicNumbers.OpCost.wildcardCost;
  }
}
