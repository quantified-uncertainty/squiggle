import * as Result from "../../utility/result";
import * as E_A_Floats from "../../utility/E_A_Floats";
import * as E_A_Sorted from "../../utility/E_A_Sorted";
import * as Discrete from "../../PointSet/Discrete";
import * as XYShape from "../../XYShape";

import { OperationError } from "../../operationError";
import { ContinuousShape } from "../../PointSet/Continuous";
import { DiscreteShape } from "../../PointSet/Discrete";
import { PointSetDist } from "../PointSetDist";
import { BaseDist } from "../BaseDist";
import {
  DistError,
  distOperationError,
  otherError,
  tooFewSamplesForConversionToPointSet,
} from "../DistError";
import { Env } from "../env";
import { samplesToPointSetDist } from "./samplesToPointSetDist";
import { buildMixedShape } from "../../PointSet/Mixed";

export class SampleSetDist extends BaseDist {
  samples: readonly number[];
  private constructor(samples: readonly number[]) {
    super();
    this.samples = samples;
  }

  static make(a: readonly number[]): Result.result<SampleSetDist, DistError> {
    if (a.length > 5) {
      return Result.Ok(new SampleSetDist(a));
    } else {
      return Result.Error({ type: "TooFewSamples" });
    }
  }

  static fromFn(
    fn: (i: number) => number,
    env: Env
  ): Result.result<SampleSetDist, DistError> {
    const sampleCount = env.sampleCount;
    const samples: number[] = [];
    for (let i = 0; i < env.sampleCount; i++) {
      samples.push(fn(i));
    }
    return SampleSetDist.make(samples);
  }

  toString() {
    return "Sample Set Distribution";
  }

  toSparkline(bucketCount: number, env: Env): Result.result<string, DistError> {
    return Result.bind(
      this.toPointSetDist({
        // In this process we want the xyPointLength to be a bit longer than the eventual toSparkline downsampling. 3 is fairly arbitrarily.
        xyPointLength: bucketCount * 3,
        sampleCount: env.sampleCount,
      }),
      (r) => r.toSparkline(bucketCount)
    );
  }

  static fromDist(
    d: BaseDist,
    env: Env
  ): Result.result<SampleSetDist, DistError> {
    return SampleSetDist.make(d.sampleN(env.sampleCount));
  }

  integralEndY() {
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

  truncate(leftCutoff: number | undefined, rightCutoff: number | undefined) {
    let truncated = this.samples;
    if (leftCutoff !== undefined) {
      truncated = truncated.filter((x) => x >= leftCutoff);
    }
    if (rightCutoff !== undefined) {
      truncated = truncated.filter((x) => x <= rightCutoff);
    }
    return SampleSetDist.make(truncated);
  }

  // Randomly get one sample from the distribution
  sample() {
    const index = Math.floor(Math.random() * this.samples.length);
    return this.samples[index];
  }

  /*
If asked for a length of samples shorter or equal the length of the distribution,
return this first n samples of this distribution.
Else, return n random samples of the distribution.
The former helps in cases where multiple distributions are correlated.
However, if n > length(t), then there's no clear right answer, so we just randomly
sample everything.
*/
  sampleN(n: number): number[] {
    if (n <= this.samples.length) {
      return this.samples.slice(0, n);
    } else {
      const result: number[] = [];
      for (let i = 1; i <= n; i++) {
        result.push(this.sample());
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
    return E_A_Sorted.percentile(sorted, f);
  }

  pdf(f: number, opts: { env: Env }) {
    const pointSetDistR = this.toPointSetDist(opts.env);
    if (!pointSetDistR.ok) {
      return pointSetDistR;
    }
    return pointSetDistR.value.pdf(f);
  }

  stdev(): Result.result<number, DistError> {
    return Result.Ok(E_A_Floats.stdev(this.samples));
  }
  variance(): Result.result<number, DistError> {
    return Result.Ok(E_A_Floats.variance(this.samples));
  }
  mode(): Result.result<number, DistError> {
    return Result.Error(
      otherError(
        "Not implemented, https://github.com/quantified-uncertainty/squiggle/issues/1392"
      )
    );
  }

  toPointSetDist(env: Env): Result.result<PointSetDist, DistError> {
    const dists = samplesToPointSetDist(
      this.samples,
      env.xyPointLength,
      undefined
    );

    const result = buildMixedShape({
      continuous: dists.continuousDist
        ? new ContinuousShape({ xyShape: dists.continuousDist })
        : undefined,
      discrete: new DiscreteShape({ xyShape: dists.discreteDist }),
    });
    if (!result) {
      return Result.Error(tooFewSamplesForConversionToPointSet());
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
}

export type SampleSetError =
  | {
      type: "TooFewSamples";
    }
  | {
      type: "NonNumericInput";
      value: string;
    }
  | {
      type: "OperationError";
      value: OperationError;
    };

export type PointsetConversionError = "TooFewSamplesForConversionToPointSet";

export const Error = {
  pointsetConversionErrorToString(err: PointsetConversionError) {
    if (err === "TooFewSamplesForConversionToPointSet") {
      return "Too Few Samples to convert to point set";
    } else {
      throw new global.Error("Internal error");
    }
  },

  toString(err: SampleSetError) {
    switch (err.type) {
      case "TooFewSamples":
        return "Too few samples when constructing sample set";
      case "NonNumericInput":
        return `Found a non-number in input: ${err.value}`;
      case "OperationError":
        return err.value.toString();
      default:
        throw new global.Error(
          `Internal error: unexpected error type ${(err as any).type}`
        );
    }
  },
};

const buildSampleSetFromFn = (
  n: number,
  fn: (i: number) => Result.result<number, OperationError>
): Result.result<SampleSetDist, DistError> => {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const result = fn(i);
    if (!result.ok) {
      return Result.Error(distOperationError(result.value));
    }
    samples.push(result.value);
  }
  return SampleSetDist.make(samples);
};

// TODO: Figure out what to do if distributions are different lengths.
// Currently we just drop all extra values.
export const map2 = ({
  fn,
  t1,
  t2,
}: {
  fn: (v1: number, v2: number) => Result.result<number, OperationError>;
  t1: SampleSetDist;
  t2: SampleSetDist;
}): Result.result<SampleSetDist, DistError> => {
  const length = Math.min(t1.samples.length, t2.samples.length);
  return buildSampleSetFromFn(length, (i) => fn(t1.samples[i], t2.samples[i]));
};

export const map3 = ({
  fn,
  t1,
  t2,
  t3,
}: {
  fn: (
    v1: number,
    v2: number,
    v3: number
  ) => Result.result<number, OperationError>;
  t1: SampleSetDist;
  t2: SampleSetDist;
  t3: SampleSetDist;
}): Result.result<SampleSetDist, DistError> => {
  const length = Math.min(
    t1.samples.length,
    t2.samples.length,
    t3.samples.length
  );
  return buildSampleSetFromFn(length, (i) =>
    fn(t1.samples[i], t2.samples[i], t3.samples[i])
  );
};

export const mapN = ({
  fn,
  t1,
}: {
  fn: (v: number[]) => Result.result<number, OperationError>;
  t1: SampleSetDist[];
}): Result.result<SampleSetDist, DistError> => {
  const length = Math.max(...t1.map((t) => t.samples.length));
  return buildSampleSetFromFn(length, (i) =>
    fn(
      t1
        .map((t) => (i < t.samples.length ? t.samples[i] : undefined))
        .filter((v): v is number => v !== undefined)
    )
  );
};

export const mixture = (
  values: [SampleSetDist, number][],
  intendedLength: number
): Result.result<SampleSetDist, DistError> => {
  const dists = values.map((pair) => pair[0]);
  const totalWeight = values.reduce((acc, v) => acc + v[1], 0);

  const discreteSamples = Discrete.sampleN(
    new DiscreteShape({
      xyShape: XYShape.T.fromZippedArray(
        values.map(([, weight], i) => [i, weight / totalWeight])
      ),
    }),
    intendedLength
  );

  const samples = discreteSamples.map((distIndexToChoose, index) => {
    const chosenDist = dists[distIndexToChoose];
    if (chosenDist.samples.length < index) {
      throw new global.Error("Mixture unreachable error"); // https://github.com/quantified-uncertainty/squiggle/issues/1405
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
  return map2({ fn: (a, b) => Result.Ok(Math.min(a, b)), t1, t2 });
};
export const maxOfTwo: CompareTwoDistsFn = (t1, t2) => {
  return map2({ fn: (a, b) => Result.Ok(Math.max(a, b)), t1, t2 });
};

export const minOfFloat: CompareDistWithFloatFn = (t, f) => {
  return t.samplesMap((a) => Result.Ok(Math.min(a, f)));
};
export const maxOfFloat: CompareDistWithFloatFn = (t, f) => {
  return t.samplesMap((a) => Result.Ok(Math.max(a, f)));
};
