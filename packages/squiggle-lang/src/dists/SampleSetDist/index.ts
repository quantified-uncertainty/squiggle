import * as magicNumbers from "../../magicNumbers.js";
import { OperationError } from "../../operationError.js";
import { ContinuousShape } from "../../PointSet/Continuous.js";
import * as Discrete from "../../PointSet/Discrete.js";
import { DiscreteShape } from "../../PointSet/Discrete.js";
import { buildMixedShape } from "../../PointSet/Mixed.js";
import { PRNG } from "../../rng/index.js";
import { isEqual, sample as E_A_sample } from "../../utility/E_A.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";
import * as E_A_Sorted from "../../utility/E_A_Sorted.js";
import * as Result from "../../utility/result.js";
import * as XYShape from "../../XYShape.js";
import { BaseDist } from "../BaseDist.js";
import {
  DistError,
  distOperationError,
  otherError,
  tooFewSamplesForConversionToPointSet,
} from "../DistError.js";
import { Env } from "../env.js";
import { PointSetDist } from "../PointSetDist.js";
import { samplesToPointSetDist } from "./samplesToPointSetDist.js";

export class SampleSetDist extends BaseDist {
  readonly type = "SampleSetDist";
  readonly samples: readonly number[];

  // This is public because of `TDist` implementation, but please don't call it directly.
  constructor(samples: readonly number[]) {
    super();
    this.samples = samples;
  }

  static make(a: readonly number[]): Result.result<SampleSetDist, DistError> {
    if (a.length > 5) {
      return Result.Ok(new SampleSetDist(a));
    } else {
      return Result.Err({ type: "TooFewSamples" });
    }
  }

  static fromFn(
    fn: (i: number) => number,
    env: Env
  ): Result.result<SampleSetDist, DistError> {
    const samples: number[] = [];
    for (let i = 0; i < env.sampleCount; i++) {
      samples.push(fn(i));
    }
    return SampleSetDist.make(samples);
  }

  override toString() {
    return "Sample Set Distribution";
  }

  _isEqual(other: SampleSetDist) {
    if (this.samples === other.samples) {
      return true;
    } else {
      return isEqual(this.samples, other.samples);
    }
  }

  toSparkline(bucketCount: number, env: Env): Result.result<string, DistError> {
    return Result.bind(
      this.toPointSetDist({
        // In this process we want the xyPointLength to be a bit longer than the eventual toSparkline downsampling. 3 is fairly arbitrarily.
        xyPointLength: bucketCount * 3,
        sampleCount: env.sampleCount,
        seed: magicNumbers.Environment.defaultSeed,
      }),
      (r) => r.toSparkline(bucketCount)
    );
  }

  static fromDist(
    d: BaseDist,
    env: Env,
    rng: PRNG
  ): Result.result<SampleSetDist, DistError> {
    return SampleSetDist.make(d.sampleN(env.sampleCount, rng));
  }

  integralSum() {
    // sampleset is always normalized
    return 1;
  }
  normalize() {
    return this;
  }

  min() {
    return Math.min(...this.samples);
  }
  max() {
    return Math.max(...this.samples);
  }
  mean() {
    return E_A_Floats.mean(this.samples);
  }

  // This should never have errors, so don't need to call SampleSetDist.make()
  abs() {
    return new SampleSetDist(this.samples.map(Math.abs));
  }

  truncate(
    leftCutoff: number | undefined,
    rightCutoff: number | undefined,
    { rng }: { rng: PRNG }
  ) {
    let truncated = this.samples;
    if (leftCutoff !== undefined) {
      truncated = truncated.filter((x) => x >= leftCutoff);
    }
    if (rightCutoff !== undefined) {
      truncated = truncated.filter((x) => x <= rightCutoff);
    }
    return Result.bind(
      SampleSetDist.make(truncated),
      (dist) => SampleSetDist.make(dist.sampleN(this.samples.length, rng)) // resample to original length
    );
  }

  // Randomly get one sample from the distribution
  sample(rng: PRNG) {
    return E_A_sample(this.samples, rng);
  }

  /*
If asked for a length of samples shorter or equal the length of the distribution,
return this first n samples of this distribution.
Else, return n random samples of the distribution.
The former helps in cases where multiple distributions are correlated.
However, if n > length(t), then there's no clear right answer, so we just randomly
sample everything.
*/
  sampleN(n: number, rng: PRNG): number[] {
    if (n <= this.samples.length) {
      return this.samples.slice(0, n);
    } else {
      const result: number[] = [];
      for (let i = 1; i <= n; i++) {
        result.push(this.sample(rng));
      }
      return result;
    }
  }

  cdf(f: number): number {
    const countBelowF = this.samples.reduce(
      (acc, x) => acc + (x <= f ? 1 : 0),
      0
    );
    return countBelowF / this.samples.length;
  }

  inv(f: number): number {
    const sorted = E_A_Floats.sort(this.samples);
    return E_A_Sorted.quantile(sorted, f);
  }

  pdf(f: number, opts: { env: Env }) {
    const pointSetDistR = this.toPointSetDist(opts.env);
    if (!pointSetDistR.ok) {
      return pointSetDistR;
    }
    return pointSetDistR.value.pdf(f);
  }

  variance(): Result.result<number, DistError> {
    return Result.Ok(E_A_Floats.variance(this.samples));
  }
  override mode(): Result.result<number, DistError> {
    return Result.Err(
      otherError(
        "Not implemented, https://github.com/quantified-uncertainty/squiggle/issues/1392"
      )
    );
  }

  range(
    pWidth: number,
    absolute = true
  ): Result.result<{ low: number; high: number }, DistError> {
    if (pWidth < 0 || pWidth > 1) {
      return Result.Err(otherError("pWidth must be between 0 and 1"));
    }
    const dist = absolute ? this.abs() : this;
    return Result.Ok({
      low: dist.inv(0.5 - pWidth / 2),
      high: dist.inv(0.5 + pWidth / 2),
    });
  }

  toPointSetDist(env: Env): Result.result<PointSetDist, DistError> {
    const dists = samplesToPointSetDist({
      samples: this.samples,
      continuousOutputLength: env.xyPointLength,
      kernelWidth: undefined,
    });

    const result = buildMixedShape({
      continuous: dists.continuousDist
        ? new ContinuousShape({ xyShape: dists.continuousDist })
        : undefined,
      discrete: new DiscreteShape({ xyShape: dists.discreteDist }),
    });
    if (!result) {
      return Result.Err(tooFewSamplesForConversionToPointSet());
    }
    return Result.Ok(new PointSetDist(result));
  }

  samplesMap(
    fn: (x: number) => Result.result<number, OperationError>
  ): Result.result<SampleSetDist, DistError> {
    return buildSampleSetFromFn(this.samples.length, (i) =>
      fn(this.samples[i])
    );
  }

  serialize(): readonly number[] {
    return this.samples;
  }

  static deserialize(value: readonly number[]): SampleSetDist {
    return new SampleSetDist(value);
  }

  summarize(
    keys: Array<
      "mean" | "p50" | "p5" | "p25" | "p75" | "p95" | "stdev" | "min" | "max"
    > = ["mean", "p5", "p50", "p95"]
  ) {
    const sorted = E_A_Floats.sort(this.samples);
    const allStats = {
      mean: () => this.mean(),
      p50: () => E_A_Sorted.quantile(sorted, 0.5),
      p5: () => E_A_Sorted.quantile(sorted, 0.05),
      p25: () => E_A_Sorted.quantile(sorted, 0.25),
      p75: () => E_A_Sorted.quantile(sorted, 0.75),
      p95: () => E_A_Sorted.quantile(sorted, 0.95),
      stdev: () => Math.sqrt(E_A_Floats.variance(this.samples)),
      min: () => this.min(),
      max: () => this.max(),
    };

    // Return only the requested statistics
    return Object.fromEntries(
      keys
        .map((key) => [key, allStats[key]?.()])
        .filter(([, value]) => value !== undefined)
    );
  }
}

function buildSampleSetFromFn(
  n: number,
  fn: (i: number) => Result.result<number, OperationError>
): Result.result<SampleSetDist, DistError> {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const result = fn(i);
    if (!result.ok) {
      return Result.Err(distOperationError(result.value));
    }
    samples.push(result.value);
  }
  return SampleSetDist.make(samples);
}

// TODO: Figure out what to do if distributions are different lengths.
// Currently we just drop all extra values.
export function map2({
  fn,
  dist1,
  dist2,
}: {
  fn: (v1: number, v2: number) => Result.result<number, OperationError>;
  dist1: SampleSetDist;
  dist2: SampleSetDist;
}): Result.result<SampleSetDist, DistError> {
  const length = Math.min(dist1.samples.length, dist2.samples.length);
  return buildSampleSetFromFn(length, (i) =>
    fn(dist1.samples[i], dist2.samples[i])
  );
}

export function map3({
  fn,
  dist1,
  dist2,
  dist3,
}: {
  fn: (
    v1: number,
    v2: number,
    v3: number
  ) => Result.result<number, OperationError>;
  dist1: SampleSetDist;
  dist2: SampleSetDist;
  dist3: SampleSetDist;
}): Result.result<SampleSetDist, DistError> {
  const length = Math.min(
    dist1.samples.length,
    dist2.samples.length,
    dist3.samples.length
  );
  return buildSampleSetFromFn(length, (i) =>
    fn(dist1.samples[i], dist2.samples[i], dist3.samples[i])
  );
}

export function mapN({
  fn,
  dists,
}: {
  fn: (v: number[]) => Result.result<number, OperationError>;
  dists: readonly SampleSetDist[];
}): Result.result<SampleSetDist, DistError> {
  const length = Math.min(...dists.map((dist) => dist.samples.length));
  return buildSampleSetFromFn(length, (i) =>
    fn(dists.map((dist) => dist.samples[i]))
  );
}

export const mixture = (
  values: [SampleSetDist, number][],
  intendedLength: number,
  rng: PRNG
): Result.result<SampleSetDist, DistError> => {
  const dists = values.map((pair) => pair[0]);
  const totalWeight = values.reduce((acc, v) => acc + v[1], 0);

  const discreteSamples = Discrete.sampleN(
    new DiscreteShape({
      xyShape: XYShape.T.fromZippedArray(
        values.map(([, weight], i) => [i, weight / totalWeight])
      ),
    }),
    intendedLength,
    rng
  );

  const samples = discreteSamples.map((distIndexToChoose, index) => {
    const chosenDist = dists[distIndexToChoose];
    if (chosenDist.samples.length < index) {
      throw new Error("Mixture unreachable error"); // https://github.com/quantified-uncertainty/squiggle/issues/1405
    }
    return chosenDist.samples[index];
  });
  return SampleSetDist.make(samples);
};

export type CompareTwoDistsFn = (
  t1: SampleSetDist,
  t2: SampleSetDist
) => Result.result<SampleSetDist, DistError>;

export type CompareDistWithFloatFn = (
  t: SampleSetDist,
  f: number
) => Result.result<SampleSetDist, DistError>;

export const minOfTwo: CompareTwoDistsFn = (t1, t2) => {
  return map2({
    fn: (a, b) => Result.Ok(Math.min(a, b)),
    dist1: t1,
    dist2: t2,
  });
};
export const maxOfTwo: CompareTwoDistsFn = (t1, t2) => {
  return map2({
    fn: (a, b) => Result.Ok(Math.max(a, b)),
    dist1: t1,
    dist2: t2,
  });
};

export const minOfFloat: CompareDistWithFloatFn = (t, f) => {
  return t.samplesMap((a) => Result.Ok(Math.min(a, f)));
};
export const maxOfFloat: CompareDistWithFloatFn = (t, f) => {
  return t.samplesMap((a) => Result.Ok(Math.max(a, f)));
};
