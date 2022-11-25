import { rsResult } from "../rsResult";
import {
  PointsetConversionError,
  SampleSetError,
} from "./SampleSetDist/SampleSetDist";

export type Env = {
  sampleCount: number; // int
  xyPointLength: number; // int
};

export abstract class BaseDist<Self> {
  abstract min(): number;
  abstract max(): number;
  abstract mean(): number;

  abstract sample(): number;
  abstract sampleN(n: number): number[];

  abstract normalize(): Self;

  abstract truncate(
    left: number | undefined,
    right: number | undefined
  ): rsResult<Self, SampleSetError>; // FIXME - better error type

  abstract integralEndY(): number;

  abstract pdf(
    x: number,
    opts: { env: Env }
  ): rsResult<number, PointsetConversionError>; // FIXME - better error type
  abstract cdf(x: number): number;
  abstract inv(x: number): number;
}
