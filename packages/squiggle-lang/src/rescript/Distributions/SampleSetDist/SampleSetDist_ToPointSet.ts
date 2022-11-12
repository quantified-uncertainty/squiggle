import { kde } from "./KdeLibrary";
import { JS_distJs } from "./SampleSetDist.gen";
import { nrd0 } from "./SampleSetDist_Bandwidth";
import { splitContinuousAndDiscrete } from "./SplitContinuousAndDiscrete";

const minDiscreteToKeep = (samples: number[]) =>
  Math.max(20, samples.length / 50);

export const toPointSetDist = (
  samples: number[],
  outputXYPoints: number,
  kernelWidth?: number
): JS_distJs => {
  samples = Array.from(new Float64Array(samples).sort());

  const { continuousPart, discretePart } = splitContinuousAndDiscrete(
    samples,
    minDiscreteToKeep(samples)
  );

  const contLength = continuousPart.length;
  let pointWeight = 1 / samples.length;

  let continuousDist = undefined;
  let samplingStats = undefined;

  if (contLength <= 5) {
    // Drop these points and adjust weight accordingly
    pointWeight = 1 / (samples.length - contLength);
  } else if (continuousPart[0] === continuousPart[contLength - 1]) {
    // All the same value: treat as discrete
    discretePart.xs.push(contLength);
    discretePart.ys.push(continuousPart[0]);
  } else {
    // The only reason we compute _suggestedXWidth if kernelWidth is
    // given is to log it. Unnecessary?
    const bandwidthXSuggested = nrd0(continuousPart);
    const width = kernelWidth || bandwidthXSuggested;
    const {
      usedWidth: bandwidthXImplemented,
      xs,
      ys,
    } = kde(continuousPart, outputXYPoints, width, pointWeight);
    continuousDist = { xs, ys };
    samplingStats = {
      outputXYPoints,
      bandwidthXSuggested,
      bandwidthXImplemented,
    };
  }

  discretePart.ys = discretePart.ys.map((count: number) => count * pointWeight);

  return {
    continuousDist,
    discreteDist: discretePart,
  };
};
