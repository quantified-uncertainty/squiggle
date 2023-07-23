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

const applyIf = <T>(value: T, condition: boolean, fn: (val: T) => T): T =>
  condition ? fn(value) : value;

// Zero values should ve very infrequent, but we need to catch them if they exist.
const logValues = (samples: number[]) =>
  samples.map((x) => (x === 0 ? 0 : Math.log(x)));

const unLogValues = ({ xs, ys }: { xs: number[]; ys: number[] }) => ({
  xs: xs.map(Math.exp),
  ys: ys.map((y, index) => y / Math.exp(xs[index])),
});

const reverseNegative = ({ xs, ys }: { xs: number[]; ys: number[] }) => ({
  xs: xs.map((x) => -x),
  ys: ys.map((y) => -y),
});

// Takes a set of either all positive or all negative samples,
// takes the log of them, takes the KDE, and then reversed that process.
const wrappedKde = (
  samples: number[],
  weight: number,
  outputXYPoints: number,
  negativePoints: boolean = false
): { xs: number[]; ys: number[] } => {
  const adjustedSamples = logValues(
    applyIf(samples, negativePoints, (s) => s.map(Math.abs))
  );

  const width = nrd0(adjustedSamples);
  const { xs, ys } = kde(adjustedSamples, outputXYPoints, width, weight);

  return applyIf(unLogValues({ xs, ys }), negativePoints, reverseNegative);
};

const logKde = (
  samples: number[],
  weight: number,
  outputXYPoints: number
): { xs: number[]; ys: number[] } => {
  const [positiveValues, negativeValues] = [
    samples.filter((value) => value > 0),
    samples.filter((value) => value < 0),
  ];

  const [positiveWeight, negativeWeight] = [
    weight * (positiveValues.length / samples.length),
    weight * (negativeValues.length / samples.length),
  ];

  const [positivePart, negativePart] = [
    positiveValues.length > 5
      ? wrappedKde(positiveValues, positiveWeight, outputXYPoints)
      : { xs: [], ys: [] },
    negativeValues.length > 5
      ? wrappedKde(negativeValues, negativeWeight, outputXYPoints, true)
      : { xs: [], ys: [] },
  ];

  return {
    xs: [...negativePart.xs, ...positivePart.xs],
    ys: [...negativePart.ys, ...positivePart.ys],
  };
};

const regularKde = (
  samples: number[],
  weight: number,
  outputXYPoints: number,
  kernelWidth?: number
): { xs: number[]; ys: number[] } => {
  const width = kernelWidth ?? nrd0(samples);
  return kde(samples, outputXYPoints, width, weight);
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
    continuousDist = logKde(continuousPart, pointWeight, outputXYPoints);
  }

  discretePart.ys = discretePart.ys.map((count: number) => count * pointWeight);

  return {
    continuousDist,
    discreteDist: discretePart,
  };
};
