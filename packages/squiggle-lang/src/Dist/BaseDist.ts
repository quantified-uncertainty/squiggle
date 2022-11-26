import { rsResult } from "../rsResult";
import * as RSResult from "../rsResult";
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
  ): rsResult<BaseDist, DistError>;

  abstract integralEndY(): number;

  abstract pdf(x: number, opts: { env: Env }): rsResult<number, DistError>;
  abstract cdf(x: number): number;
  abstract inv(x: number): number;

  stdev(): rsResult<number, DistError> {
    return RSResult.Error(notYetImplemented());
  }
  variance(): rsResult<number, DistError> {
    return RSResult.Error(notYetImplemented());
  }
  mode(): rsResult<number, DistError> {
    return RSResult.Error(notYetImplemented());
  }

  abstract toPointSetDist(env: Env): rsResult<PointSetDist, DistError>;
  abstract toSparkline(
    bucketCount: number,
    env: Env
  ): rsResult<string, DistError>;

  expectedConvolutionCost() {
    return magicNumbers.OpCost.wildcardCost;
  }
}
