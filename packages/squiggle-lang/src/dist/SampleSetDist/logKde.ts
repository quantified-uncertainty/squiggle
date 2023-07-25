import { kde, kdeParams } from "./kde.js";
import { XYShape, Range } from "../../XYShape.js";

const MIN_SAMPLES_FOR_KDE = 5;

// Zero values should ve very infrequent, but we need to catch them if they exist.
const logSamples = (samples: number[]) =>
  samples.map((x) => (x === 0 ? 0 : Math.log(x)));

const unLogShape = ({ xs, ys }: XYShape): XYShape => {
  const adjustedXs = xs.map((x) => Math.exp(x));
  const adjustedYs = ys.map((y, index) => y * adjustedXs[index]);
  return { xs: adjustedXs, ys: adjustedYs };
};

const reverseNegativeShape = ({ xs, ys }: XYShape): XYShape => ({
  xs: xs
    .slice()
    .reverse()
    .map((x) => -x),
  ys: ys
    .slice()
    .reverse()
    .map((y) => y),
});

type sign = "positive" | "negative";

// Takes a set of either all positive or all negative samples,
// takes the log of them, takes the KDE, and then takes the exp of the result.
const logKdeSingleSide = ({
  samples,
  weight,
  outputLength,
  kernelWidth,
  sign,
}: kdeParams & { sign: sign }): XYShape => {
  let adjustedSamples = samples;
  if (sign === "negative") {
    adjustedSamples = adjustedSamples.map(Math.abs).slice().reverse();
  }
  adjustedSamples = logSamples(adjustedSamples);

  const { xs, ys } = kde({
    samples: adjustedSamples,
    outputLength: Math.round(outputLength),
    weight,
    kernelWidth,
  });

  let result = unLogShape({ xs, ys });
  if (sign === "negative") {
    result = reverseNegativeShape(result);
  }
  return result;
};

/**
 * Splits samples at 0 into positive and negative parts. Takes the log KDE of each part, and
 * then combines them.
 */
export const logKde = ({
  samples,
  outputLength,
  weight,
  kernelWidth,
}: kdeParams): XYShape => {
  const singleSideKde = (sign: sign) => {
    let sideSamples =
      sign === "positive"
        ? samples.filter((v) => v >= 0)
        : samples.filter((v) => v < 0);
    if (sideSamples.length < 2) {
      sideSamples = [];
    }
    const proportion = sideSamples.length / samples.length;
    return logKdeSingleSide({
      samples: sideSamples,
      weight: weight * proportion,
      outputLength: Math.round(outputLength * proportion),
      kernelWidth,
      sign,
    });
  };

  const [positivePart, negativePart] = [
    singleSideKde("positive"),
    singleSideKde("negative"),
  ];
  // console.log("SIDES", positivePart, negativePart);

  const result = {
    xs: [...negativePart.xs, ...positivePart.xs],
    ys: [...negativePart.ys, ...positivePart.ys],
  };
  console.log(
    "Integral",
    Range.integrateWithTriangles(result),
    "result",
    result
  );
  return result;
};
