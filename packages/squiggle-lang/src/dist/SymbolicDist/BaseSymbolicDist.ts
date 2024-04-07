import * as magicNumbers from "../../magicNumbers.js";
import { ContinuousShape } from "../../PointSet/Continuous.js";
import { PRNG } from "../../rng/index.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { JsonValue } from "../../utility/typeHelpers.js";
import * as XYShape from "../../XYShape.js";
import { BaseDist } from "../BaseDist.js";
import { DistError, xyShapeDistError } from "../DistError.js";
import { Env } from "../env.js";
import { PointSetDist } from "../PointSetDist.js";

export type PointsetXSelection = "Linear" | "ByWeight";

export abstract class BaseSymbolicDist<
  SymbolicType extends string,
  Args extends JsonValue,
> extends BaseDist {
  type = "SymbolicDist";
  abstract symbolicType: SymbolicType;

  private static minCdfValue = 0.0001;
  private static maxCdfValue = 0.9999;

  // all symbolic dists must override this
  abstract override toString(): string;

  // FIXME - copy-pasted from SampleSetDist
  toSparkline(bucketCount: number, env: Env): Result.result<string, DistError> {
    return Result.bind(
      this.toPointSetDist(
        {
          // In this process we want the xyPointLength to be a bit longer than the eventual toSparkline downsampling. 3 is fairly arbitrarily.
          xyPointLength: bucketCount * 3,
          sampleCount: env.sampleCount,
          seed: env.seed, // This is awkward because we're not actually using the seed. This should be refactored later.
        },
        "Linear" // this makes this method slightly different from SampleSetDist version
      ),
      (r) => r.toSparkline(bucketCount)
    );
  }

  // symbolic dists are always normalized
  normalize() {
    return this;
  }
  integralSum() {
    return 1;
  }

  // without result wrapper, guaranteed to work on symbolic dists
  protected abstract simplePdf(f: number): number;

  pdf(f: number): Result.result<number, DistError> {
    return Ok(this.simplePdf(f));
  }

  protected interpolateXs(opts: {
    xSelection: PointsetXSelection;
    points: number;
    env: Env;
  }): number[] {
    const { xSelection, points } = opts;
    // note: this method is customized in Uniform
    switch (xSelection) {
      case "Linear":
        return E_A_Floats.range(this.min(), this.max(), points);
      case "ByWeight": {
        const ys = E_A_Floats.range(
          BaseSymbolicDist.minCdfValue,
          BaseSymbolicDist.maxCdfValue,
          points
        );
        return ys.map((y) => this.inv(y));
      }
      default:
        throw new Error(`Unknown xSelection value ${xSelection}`);
    }
  }

  toPointSetDist(
    env: Env,
    xSelection: PointsetXSelection = "ByWeight"
  ): result<PointSetDist, DistError> {
    const xs = this.interpolateXs({
      xSelection,
      points: env.xyPointLength,
      env,
    });
    const ys = xs.map((x) => this.simplePdf(x));
    const xyShapeR = XYShape.T.make(xs, ys);
    if (!xyShapeR.ok) {
      return Result.Err(xyShapeDistError(xyShapeR.value));
    }

    return Ok(
      new PointSetDist(
        new ContinuousShape({
          integralSumCache: 1, // this is a lie; real integral sum is not exactly 1 because of linear interpolation.
          xyShape: xyShapeR.value,
        }).toMixed()
      )
    );
  }

  truncate(
    left: number | undefined,
    right: number | undefined,
    opts?: { env: Env }
  ): result<BaseDist, DistError> {
    if (!opts) {
      throw new Error("env is necessary for truncating a symbolic dist");
    }
    if (left === undefined && right === undefined) {
      return Result.Ok(this);
    }

    const pointSetDistR = this.toPointSetDist(opts.env);
    if (!pointSetDistR.ok) {
      return pointSetDistR;
    }
    return pointSetDistR.value.truncate(left, right);
  }

  min() {
    return this.inv(BaseSymbolicDist.minCdfValue);
  }

  max() {
    return this.inv(BaseSymbolicDist.maxCdfValue);
  }

  sampleN(n: number, rng: PRNG) {
    const result: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = this.sample(rng);
    }
    return result;
  }

  override expectedConvolutionCost(): number {
    return magicNumbers.OpCost.symbolicCost;
  }

  isFloat(): boolean {
    return false;
  }

  abstract getArgs(): Args;
}
