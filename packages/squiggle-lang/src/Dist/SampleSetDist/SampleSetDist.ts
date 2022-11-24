import * as RSResult from "../../rsResult";
import * as SampleSetDist_ToPointSet from "./SampleSetDist_ToPointSet";
import * as MixedShapeBuilder from "../../PointSet/MixedShapeBuilder";
import * as E_A_Floats from "../../utility/E_A_Floats";
import * as E_A_Sorted from "../../utility/E_A_Sorted";
import * as Discrete from "../../PointSet/Discrete";
import * as XYShape from "../../XYShape";

import { OperationError, operationErrorToString } from "../../OperationError";
import { PointSet } from "../../PointSet/types";
import { ContinuousShape } from "../../PointSet/Continuous";
import { DiscreteShape } from "../../PointSet/Discrete";

export type SampleSetDist = readonly number[];

type SampleSetError =
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

type PointsetConversionError = "TooFewSamplesForConversionToPointSet";

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

/*
TODO: Refactor to get a more precise estimate. Also, this code is just fairly messy, could use
some refactoring.
*/
export const toPointSetDist = ({
  samples,
  samplingInputs,
}: {
  samples: SampleSetDist;
  samplingInputs: SamplingInputs;
}): RSResult.rsResult<PointSet, PointsetConversionError> => {
  const dists = SampleSetDist_ToPointSet.toPointSetDist(
    samples,
    samplingInputs.outputXYPoints,
    samplingInputs.kernelWidth
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
  return RSResult.Ok(result);
};

export const make = (
  a: readonly number[]
): RSResult.rsResult<SampleSetDist, SampleSetError> => {
  if (a.length > 5) {
    return RSResult.Ok(a);
  } else {
    return RSResult.Error({ type: "TooFewSamples" });
  }
};

// Randomly get one sample from the distribution
export const sample = (t: SampleSetDist): number => {
  const index = Math.floor(Math.random() * t.length);
  return t[index];
};

/*
If asked for a length of samples shorter or equal the length of the distribution,
return this first n samples of this distribution.
Else, return n random samples of the distribution.
The former helps in cases where multiple distributions are correlated.
However, if n > length(t), then there's no clear right answer, so we just randomly
sample everything.
*/
export const sampleN = (t: SampleSetDist, n: number): number[] => {
  if (n <= t.length) {
    return t.slice(0, n);
  } else {
    const result: number[] = [];
    for (let i = 1; i <= n; i++) {
      result.push(sample(t));
    }
    return result;
  }
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
  return make(samples);
};

export const samplesMap = (
  t: SampleSetDist,
  fn: (x: number) => RSResult.rsResult<number, OperationError>
): RSResult.rsResult<SampleSetDist, SampleSetError> => {
  return buildSampleSetFromFn(t.length, (i) => fn(t[i]));
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
  const length = Math.min(t1.length, t2.length);
  return buildSampleSetFromFn(length, (i) => fn(t1[i], t2[i]));
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
  const length = Math.min(t1.length, t2.length, t3.length);
  return buildSampleSetFromFn(length, (i) => fn(t1[i], t2[i], t3[i]));
};

export const mapN = ({
  fn,
  t1,
}: {
  fn: (v: number[]) => RSResult.rsResult<number, OperationError>;
  t1: SampleSetDist[];
}): RSResult.rsResult<SampleSetDist, SampleSetError> => {
  const length = Math.max(...t1.map((t) => t.length));
  return buildSampleSetFromFn(length, (i) =>
    fn(
      t1
        .map((t) => (i < t.length ? t[i] : undefined))
        .filter((v): v is number => v !== undefined)
    )
  );
};

export const mean = (t: SampleSetDist): number => E_A_Floats.mean(t);

// let geomean = t => T.get(t)->E.A.Floats.geomean
export const mode = (t: SampleSetDist): number => {
  // this was calling Jstat.mode but needs to be reimplemented
  throw new global.Error(
    "https://github.com/quantified-uncertainty/squiggle/issues/1392"
  );
};
// let sum = t => T.get(t)->E.A.Floats.sum
export const min = (t: SampleSetDist): number => {
  return Math.min(...t);
};
export const max = (t: SampleSetDist): number => {
  return Math.max(...t);
};
export const stdev = (t: SampleSetDist): number => {
  return E_A_Floats.stdev(t);
};
export const variance = (t: SampleSetDist): number => {
  return E_A_Floats.variance(t);
};
export const percentile = (t: SampleSetDist, f: number): number => {
  const sorted = E_A_Floats.sorted(t);
  return E_A_Sorted.percentile(sorted, f);
};
export const cdf = (t: SampleSetDist, f: number): number => {
  const countBelowF = t.reduce((acc, x) => acc + (x <= f ? 1 : 0), 0);
  return countBelowF / t.length;
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
    if (chosenDist.length < index) {
      throw new global.Error("Mixture unreachable error"); // https://github.com/quantified-uncertainty/squiggle/issues/1405
    }
    return chosenDist[index];
  });
  return make(samples);
};

export const truncate = (
  t: SampleSetDist,
  leftCutoff: number | undefined,
  rightCutoff: number | undefined
) => {
  let truncated = t;
  if (leftCutoff !== undefined) {
    truncated = truncated.filter((x) => x >= leftCutoff);
  }
  if (rightCutoff !== undefined) {
    truncated = truncated.filter((x) => x <= rightCutoff);
  }
  return make(truncated);
};

export const minOfTwo = (t1: SampleSetDist, t2: SampleSetDist) => {
  return map2({ fn: (a, b) => RSResult.Ok(Math.min(a, b)), t1, t2 });
};
export const maxOfTwo = (t1: SampleSetDist, t2: SampleSetDist) => {
  return map2({ fn: (a, b) => RSResult.Ok(Math.max(a, b)), t1, t2 });
};

export const minOfFloat = (t: SampleSetDist, f: number) => {
  return samplesMap(t, (a) => RSResult.Ok(Math.min(a, f)));
};
export const maxOfFloat = (t: SampleSetDist, f: number) => {
  return samplesMap(t, (a) => RSResult.Ok(Math.max(a, f)));
};
