import { kde } from "./kde.js";
import { XYShape } from "../../XYShape.js";
import { splitContinuousAndDiscrete } from "./splitContinuousAndDiscrete.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";
import { logKde } from "./logKde.js";
import { SampleSetDist } from "./index.js";

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

let checkIfShouldBeLog = (samples: number[]) => {
  const dist = SampleSetDist.make(samples);
  if (dist.ok) {
    const range = dist.value.range(0.8, true);
    if (range.ok) {
      const { low, high } = range.value;
      return shouldBeLogHeuristicFn({ p10: low, p90: high });
    }
  }
  return undefined;
};

export const samplesToPointSetDist = ({
  samples,
  continuousOutputLength,
  kernelWidth,
  logScale,
}: SamplesToPointSetDistParams): ConversionResult => {
  samples = E_A_Floats.sort(samples);
  let countedLength = samples.length;

  let { continuousSamples, discreteShape } = splitContinuousAndDiscrete(
    samples,
    minDiscreteToKeep(samples)
  );

  if (continuousSamples.length < MIN_SAMPLES_FOR_KDE) {
    countedLength -= continuousSamples.length;
    continuousSamples = [];
  }

  let pointWeight = 1 / countedLength;

  let continuousDist = undefined;
  if (continuousSamples.length > 0) {
    const kdeParams = {
      samples: continuousSamples,
      outputLength: continuousOutputLength,
      weight: pointWeight,
      kernelWidth,
    };

    let _logScale = logScale;
    if (_logScale === undefined) {
      const shouldBeLogHeuristic = checkIfShouldBeLog(continuousSamples);
      if (shouldBeLogHeuristic !== undefined) {
        _logScale = shouldBeLogHeuristic;
      }
    }
    if (_logScale) {
      continuousDist = logKde(kdeParams);
    } else {
      continuousDist = kde(kdeParams);
    }
  }

  discreteShape.ys = discreteShape.ys.map((y) => y * pointWeight);

  return {
    continuousDist,
    discreteDist: discreteShape,
  };
};
