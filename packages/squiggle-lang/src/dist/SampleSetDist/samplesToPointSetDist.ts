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
  outputPointLength: number;
  kernelWidth?: number;
  logScale?: boolean;
};

type ConversionResult = {
  continuousDist: XYShape | undefined;
  discreteDist: XYShape;
};

export const samplesToPointSetDist = ({
  samples,
  outputPointLength,
  kernelWidth,
  logScale = true,
}: SamplesToPointSetDistParams): ConversionResult => {
  samples = E_A_Floats.sort(samples);

  const { continuousSamples, discreteSamples } = splitContinuousAndDiscrete(
    samples,
    minDiscreteToKeep(samples)
  );

  const contLength = continuousSamples.length;
  let pointWeight = 1 / samples.length;

  let continuousDist = undefined;

  const allContinuousAreSame = () =>
    continuousSamples[0] === continuousSamples[contLength - 1];

  if (contLength <= MIN_SAMPLES_FOR_KDE) {
    // Drop these points and adjust weight accordingly
    pointWeight = 1 / (samples.length - contLength);
  } else if (allContinuousAreSame()) {
    // All the same value: treat as discrete
    // TODO: Refactor this into the splitContinuousAndDiscrete function.
    // Also, it seems like xs and ys should be swapped here.
    discreteSamples.xs.push(contLength);
    discreteSamples.ys.push(continuousSamples[0]);
  } else {
    if (logScale) {
      continuousDist = logKde(
        continuousSamples,
        pointWeight,
        outputPointLength,
        kernelWidth
      );
    } else {
      continuousDist = kde(
        continuousSamples,
        outputPointLength,
        pointWeight,
        kernelWidth
      );
    }
  }

  discreteSamples.ys = discreteSamples.ys.map(
    (count: number) => count * pointWeight
  );

  return {
    continuousDist,
    discreteDist: discreteSamples,
  };
};
