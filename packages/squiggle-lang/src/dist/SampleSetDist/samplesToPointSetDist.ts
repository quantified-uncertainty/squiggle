import { kde } from "./kde.js";
import { XYShape } from "../../XYShape.js";
import {
  splitContinuousAndDiscrete,
  continuousAreSameFilter,
  minContinuousSamplesFilter,
} from "./splitContinuousAndDiscrete.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";
import { logKde } from "./logKde.js";
import { SampleSetDist } from "./index.js";
import sum from "lodash/sum.js";

const minDiscreteToKeep = (samples: readonly number[]) =>
  Math.max(20, Math.round(samples.length / 50));

const MIN_SAMPLES_FOR_KDE = 5;

type SamplesToPointSetDistParams = {
  samples: readonly number[];
  continuousOutputLength: number;
  kernelWidth?: number;
  logScale?: boolean;
};

type ConversionResult = {
  continuousDist: XYShape | undefined;
  discreteDist: XYShape;
};

// This is a very rough heuristic. It's really not clear what's optimal.
// I did this by testing that normal and uniform dists would not satisfy this, but
// many lognormal distributions would.
const shouldBeLogHeuristicFn = ({ p10, p90 }: { p10: number; p90: number }) => {
  return Math.log(p90 / p10) > 3;
};

const checkIfShouldBeLog = (samples: number[]): boolean => {
  const dist = SampleSetDist.make(samples);
  if (dist.ok) {
    const range = dist.value.range(0.8, true);
    if (range.ok) {
      const { low, high } = range.value;
      return shouldBeLogHeuristicFn({ p10: low, p90: high });
    }
  }
  return false;
};

export const samplesToPointSetDist = ({
  samples: unsortedSamples,
  continuousOutputLength,
  kernelWidth,
  logScale,
}: SamplesToPointSetDistParams): ConversionResult => {
  const samples = E_A_Floats.sort(unsortedSamples);
  const { continuousSamples, discreteShape } = minContinuousSamplesFilter(
    MIN_SAMPLES_FOR_KDE,
    continuousAreSameFilter(
      splitContinuousAndDiscrete(samples, minDiscreteToKeep(samples))
    )
  );

  // Some samples might have been filtered out in the filter stage above, so we need to adjust the weights accordingly.
  const relevantSampleLength = continuousSamples.length + sum(discreteShape.ys);
  const pointWeight = 1 / relevantSampleLength;

  let continuousDist;
  if (continuousSamples.length > 0) {
    const kdeParams = {
      samples: continuousSamples,
      outputLength: continuousOutputLength,
      weight: pointWeight,
      kernelWidth,
    };

    if (logScale === undefined) {
      logScale = checkIfShouldBeLog(continuousSamples);
    }

    continuousDist = logScale ? logKde(kdeParams) : kde(kdeParams);
  }

  return {
    continuousDist,
    discreteDist: {
      xs: discreteShape.xs,
      ys: discreteShape.ys.map((y) => y * pointWeight),
    },
  };
};
