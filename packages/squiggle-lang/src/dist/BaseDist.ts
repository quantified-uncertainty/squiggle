import { result } from "../utility/result.js";
import * as Result from "../utility/result.js";
import { DistError, notYetImplemented } from "./DistError.js";
import { PointSetDist } from "./PointSetDist.js";
import * as magicNumbers from "../magicNumbers.js";
import { Env } from "./env.js";

export abstract class BaseDist {
  abstract min(): number;
  abstract max(): number;
  abstract mean(): number;

  abstract sample(): number;
  abstract sampleN(n: number): number[];

  abstract normalize(): BaseDist;
  isNormalized(): boolean {
    return Math.abs(this.integralSum() - 1) < 1e-7;
  }

  abstract truncate(
    left: number | undefined,
    right: number | undefined,
    opts?: { env: Env } // needed for SymbolicDists
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
