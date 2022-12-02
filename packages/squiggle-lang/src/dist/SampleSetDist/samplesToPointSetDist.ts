import { kde } from "./kde";
import { XYShape } from "../../XYShape";
import { nrd0 } from "./bandwidth";
import { splitContinuousAndDiscrete } from "./splitContinuousAndDiscrete";
import * as E_A_Floats from "../../utility/E_A_Floats";

const minDiscreteToKeep = (samples: readonly number[]) =>
  Math.max(20, samples.length / 50);

type ConversionResult = {
  continuousDist: XYShape | undefined;
  discreteDist: XYShape;
};

export const samplesToPointSetDist = (
  samples: readonly number[],
  outputXYPoints: number,
  kernelWidth?: number
): ConversionResult => {
  samples = E_A_Floats.sort(samples);

  const { continuousPart, discretePart } = splitContinuousAndDiscrete(
    samples,
    minDiscreteToKeep(samples)
  );

  const contLength = continuousPart.length;
  let pointWeight = 1 / samples.length;

  let continuousDist = undefined;

  if (contLength <= 5) {
    // Drop these points and adjust weight accordingly
    pointWeight = 1 / (samples.length - contLength);
  } else if (continuousPart[0] === continuousPart[contLength - 1]) {
    // All the same value: treat as discrete
    discretePart.xs.push(contLength);
    discretePart.ys.push(continuousPart[0]);
  } else {
    const width = kernelWidth ?? nrd0(continuousPart);
    const { xs, ys } = kde(continuousPart, outputXYPoints, width, pointWeight);
    continuousDist = { xs, ys };
  }

  discretePart.ys = discretePart.ys.map((count: number) => count * pointWeight);

  return {
    continuousDist,
    discreteDist: discretePart,
  };
};
