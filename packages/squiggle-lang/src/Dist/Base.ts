import { rsResult } from "../rsResult";
import { DistError } from "./DistError";
import { PointSetDist } from "./PointSetDist";

export type Env = {
  sampleCount: number; // int
  xyPointLength: number; // int
};

export abstract class BaseDist {
  abstract min(): number;
  abstract max(): number;
  abstract mean(): number;

  abstract sample(): number;
  abstract sampleN(n: number): number[];

  abstract normalize(): BaseDist;

  abstract truncate(
    left: number | undefined,
    right: number | undefined,
    opts?: { env: Env } // needed for SymbolicDists
  ): rsResult<BaseDist, DistError>;

  abstract integralEndY(): number;

  abstract pdf(x: number, opts: { env: Env }): rsResult<number, DistError>;
  abstract cdf(x: number): number;
  abstract inv(x: number): number;

  abstract toPointSetDist(env: Env): rsResult<PointSetDist, DistError>;
}
