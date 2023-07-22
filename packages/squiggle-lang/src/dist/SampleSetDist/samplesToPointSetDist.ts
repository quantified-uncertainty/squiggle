import { kde } from "./kde.js";
import { XYShape } from "../../XYShape.js";
import { nrd0 } from "./bandwidth.js";
import { splitContinuousAndDiscrete } from "./splitContinuousAndDiscrete.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";

const minDiscreteToKeep = (samples: readonly number[]) =>
  Math.max(20, Math.round(samples.length / 50));

type ConversionResult = {
  continuousDist: XYShape | undefined;
  discreteDist: XYShape;
};

const wrappedKde = (
  samples: number[],
  weight: number,
  outputXYPoints: number,
  negativePoints?: boolean
): { xs: number[]; ys: number[] } => {
  const _samples = negativePoints ? samples.map((x) => -x) : samples;
  const adjustedSamples = _samples.map((x) => (x === 0 ? 0 : Math.log(x)));

  const width = nrd0(adjustedSamples);
  const { xs, ys } = kde(adjustedSamples, outputXYPoints, width, weight);
  console.log("Before processing", { _samples, adjustedSamples, xs, ys });
  const result = {
    xs: xs.map((x) => Math.exp(x)),
    ys: ys.map((y, index) => {
      let xValue = xs[index];
      return y / Math.exp(xValue);
    }),
  };
  return negativePoints
    ? {
        xs: result.xs
          .map((x) => -x)
          .slice()
          .reverse(),
        ys: result.ys
          .slice()
          .reverse()
          .map((y) => -y),
      }
    : result;
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
    let positiveValues: number[] = continuousPart.filter((value) => value > 0);
    let negativeValues: number[] = continuousPart.filter((value) => value < 0);
    let positiveWeight =
      pointWeight * (positiveValues.length / continuousPart.length);
    let negativeWeight =
      pointWeight * (negativeValues.length / continuousPart.length);
    const positivePart =
      positiveValues.length > 5
        ? wrappedKde(positiveValues, positiveWeight, outputXYPoints)
        : { xs: [], ys: [] };

    const negativePart =
      negativeValues.length > 5
        ? wrappedKde(negativeValues, negativeWeight, outputXYPoints, true)
        : { xs: [], ys: [] };
    continuousDist = {
      xs: [...negativePart.xs, ...positivePart.xs],
      ys: [...negativePart.ys, ...positivePart.ys],
    };
  }

  discretePart.ys = discretePart.ys.map((count: number) => count * pointWeight);

  return {
    continuousDist,
    discreteDist: discretePart,
  };
};
