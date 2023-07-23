import { kde } from "./kde.js";
import { XYShape } from "../../XYShape.js";
import { splitContinuousAndDiscrete } from "./splitContinuousAndDiscrete.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";
import { logKde } from "./logKde.js";

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

export const samplesToPointSetDist = ({
  samples,
  continuousOutputLength,
  kernelWidth,
  logScale = true,
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
    if (logScale) {
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
