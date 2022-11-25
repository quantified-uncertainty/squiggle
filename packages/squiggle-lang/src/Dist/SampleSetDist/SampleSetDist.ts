import * as RSResult from "../../rsResult";
import * as SampleSetDist_ToPointSet from "./SampleSetDist_ToPointSet";
import * as MixedShapeBuilder from "../../PointSet/MixedShapeBuilder";
import * as E_A_Floats from "../../utility/E_A_Floats";
import * as E_A_Sorted from "../../utility/E_A_Sorted";
import * as Discrete from "../../PointSet/Discrete";
import * as XYShape from "../../XYShape";

import { OperationError, operationErrorToString } from "../../OperationError";
import { ContinuousShape } from "../../PointSet/Continuous";
import { DiscreteShape } from "../../PointSet/Discrete";
import { PointSetDist } from "../PointSetDist";
import { BaseDist, Env } from "../Base";

export class SampleSetDist extends BaseDist<SampleSetDist> {
  samples: readonly number[];
  private constructor(samples: readonly number[]) {
    super();
    this.samples = samples;
  }

  static make(
    a: readonly number[]
  ): RSResult.rsResult<SampleSetDist, SampleSetError> {
    if (a.length > 5) {
      return RSResult.Ok(new SampleSetDist(a));
    } else {
      return RSResult.Error({ type: "TooFewSamples" });
    }
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
    const sorted = E_A_Floats.sorted(this.samples);
    return E_A_Sorted.percentile(sorted, f);
  }

  pdf(f: number, opts: { env: Env }) {
    const pointSetDistR = this.toPointSetDist(opts.env);
    if (pointSetDistR.TAG === RSResult.E.Error) {
      return pointSetDistR;
    }
    return pointSetDistR._0.pdf(f);
  }

  stdev() {
    return E_A_Floats.stdev(this.samples);
  }
  variance() {
    return E_A_Floats.variance(this.samples);
  }

  mode(): number {
    throw new global.Error(
      "https://github.com/quantified-uncertainty/squiggle/issues/1392"
    );
  }

  toPointSetDist(
    env: Env
  ): RSResult.rsResult<PointSetDist, PointsetConversionError> {
    const dists = SampleSetDist_ToPointSet.toPointSetDist(
      this.samples,
      env.xyPointLength,
      undefined
    );

    const result = MixedShapeBuilder.buildSimple({
      continuous: dists.continuousDist
        ? new ContinuousShape({ xyShape: dists.continuousDist })
        : undefined,
      discrete: new DiscreteShape({ xyShape: dists.discreteDist }),
    });
    if (!result) {
      return RSResult.Error("TooFewSamplesForConversionToPointSet");
    }
    return RSResult.Ok(new PointSetDist(result));
  }

  samplesMap(
    fn: (x: number) => RSResult.rsResult<number, OperationError>
  ): RSResult.rsResult<SampleSetDist, SampleSetError> {
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

  operationError(err: OperationError): SampleSetError {
    return { type: "OperationError", value: err };
  },

  toString(err: SampleSetError) {
    switch (err.type) {
      case "TooFewSamples":
        return "Too few samples when constructing sample set";
      case "NonNumericInput":
        return `Found a non-number in input: ${err.value}`;
      case "OperationError":
        return operationErrorToString(err.value);
      default:
        throw new global.Error(
          `Internal error: unexpected error type ${(err as any).type}`
        );
    }
  },
};

// let length = (t: t) => get(t)->E.A.length

type SamplingInputs = {
  sampleCount: number; // int
  outputXYPoints: number; // int
  kernelWidth?: number;
  pointSetDistLength: number; // int
};

// let _fromSampleResultArray = (samples: array<result<float, QuriSquiggleLang.Operation.Error.t>>) =>
//   E.A.R.firstErrorOrOpen(samples)->E.R.errMap(Error.fromOperationError)->E.R.bind(make)

const buildSampleSetFromFn = (
  n: number,
  fn: (i: number) => RSResult.rsResult<number, OperationError>
): RSResult.rsResult<SampleSetDist, SampleSetError> => {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const result = fn(i);
    if (result.TAG === RSResult.E.Error) {
      return RSResult.Error(Error.operationError(result._0));
    }
    samples.push(result._0);
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
  fn: (v1: number, v2: number) => RSResult.rsResult<number, OperationError>;
  t1: SampleSetDist;
  t2: SampleSetDist;
}): RSResult.rsResult<SampleSetDist, SampleSetError> => {
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
  ) => RSResult.rsResult<number, OperationError>;
  t1: SampleSetDist;
  t2: SampleSetDist;
  t3: SampleSetDist;
}): RSResult.rsResult<SampleSetDist, SampleSetError> => {
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
  fn: (v: number[]) => RSResult.rsResult<number, OperationError>;
  t1: SampleSetDist[];
}): RSResult.rsResult<SampleSetDist, SampleSetError> => {
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
): RSResult.rsResult<SampleSetDist, SampleSetError> => {
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

export const minOfTwo = (t1: SampleSetDist, t2: SampleSetDist) => {
  return map2({ fn: (a, b) => RSResult.Ok(Math.min(a, b)), t1, t2 });
};
export const maxOfTwo = (t1: SampleSetDist, t2: SampleSetDist) => {
  return map2({ fn: (a, b) => RSResult.Ok(Math.max(a, b)), t1, t2 });
};

export const minOfFloat = (t: SampleSetDist, f: number) => {
  return t.samplesMap((a) => RSResult.Ok(Math.min(a, f)));
};
export const maxOfFloat = (t: SampleSetDist, f: number) => {
  return t.samplesMap((a) => RSResult.Ok(Math.max(a, f)));
};
