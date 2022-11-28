import { result } from "../utility/result";
import * as Result from "../utility/result";
import { DistError, notYetImplemented } from "./DistError";
import { PointSetDist } from "./PointSetDist";
import * as magicNumbers from "../magicNumbers";
import { Env } from "./env";

export abstract class BaseDist {
  abstract min(): number;
  abstract max(): number;
  abstract mean(): number;

  abstract sample(): number;
  abstract sampleN(n: number): number[];

  abstract normalize(): BaseDist;
  isNormalized(): boolean {
    return Math.abs(this.integralEndY() - 1) < 1e-7;
  }

  abstract truncate(
    left: number | undefined,
    right: number | undefined,
    opts?: { env: Env } // needed for SymbolicDists
  ): result<BaseDist, DistError>;

  abstract integralEndY(): number;

  abstract pdf(x: number, opts: { env: Env }): result<number, DistError>;
  abstract cdf(x: number): number;
  abstract inv(x: number): number;

  stdev(): result<number, DistError> {
    return Result.Error(notYetImplemented());
  }
  variance(): result<number, DistError> {
    return Result.Error(notYetImplemented());
  }
  mode(): result<number, DistError> {
    return Result.Error(notYetImplemented());
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
