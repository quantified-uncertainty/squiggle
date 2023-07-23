import { kde } from "./kde.js";
import { XYShape } from "../../XYShape.js";

const MIN_SAMPLES_FOR_KDE = 5;

const applyIf = <T>(value: T, condition: boolean, fn: (val: T) => T): T =>
  condition ? fn(value) : value;

// Zero values should ve very infrequent, but we need to catch them if they exist.
const logValues = (samples: number[]) =>
  samples.map((x) => (x === 0 ? 0 : Math.log(x)));

const unLogValues = ({ xs, ys }: XYShape): XYShape => ({
  xs: xs.map(Math.exp),
  ys: ys.map((y, index) => y / Math.exp(xs[index])),
});

const reverseNegativeShape = ({ xs, ys }: XYShape): XYShape => ({
  xs: xs.map((x) => -x),
  ys: ys.map((y) => -y),
});

type sign = "positive" | "negative";

// Takes a set of either all positive or all negative samples,
// takes the log of them, takes the KDE, and then reversed that process.
const logKdeSingleSide = (
  samples: number[],
  weight: number,
  outputPointLength: number,
  sign: sign,
  kernelWidth?: number
): XYShape => {
  let adjustedSamples = samples;
  if (sign === "negative") {
    adjustedSamples = adjustedSamples.map(Math.abs);
  }
  adjustedSamples = logValues(samples);

  const { xs, ys } = kde(
    adjustedSamples,
    outputPointLength,
    weight,
    kernelWidth
  );

  let result = unLogValues({ xs, ys });
  if (sign === "negative") {
    result = reverseNegativeShape(result);
  }
  return result;
};

export const logKde = (
  samples: number[],
  weight: number,
  outputPointLength: number,
  kernelWidth?: number
): XYShape => {
  const singleSideKde = (sign: sign) => {
    const sideSamples =
      sign === "positive"
        ? samples.filter((v) => v >= 0)
        : samples.filter((v) => v < 0);
    const proportion = sideSamples.length / samples.length;
    const outputLength = outputPointLength * proportion;
    return sideSamples.length > MIN_SAMPLES_FOR_KDE
      ? logKdeSingleSide(
          sideSamples,
          weight * proportion,
          outputLength,
          sign,
          kernelWidth
        )
      : { xs: [], ys: [] };
  };

  const [positivePart, negativePart] = [
    singleSideKde("positive"),
    singleSideKde("negative"),
  ];

  return {
    xs: [...negativePart.xs, ...positivePart.xs],
    ys: [...negativePart.ys, ...positivePart.ys],
  };
};
