import { kde, kdeParams } from "./kde.js";
import { XYShape } from "../../XYShape.js";

const logSamples = (s: number[]) => s.map(Math.log);
const reverseNegativeSamples = (s: number[]) =>
  s.map(Math.abs).slice().reverse();

const unLogShape = ({ xs, ys }: XYShape): XYShape => {
  const adjustedXs = xs.map(Math.exp);
  //Sometimes kde() gives us back negative values. This would lead to invalid PDFs, so we adjust these manually.
  const adjustedYs = ys
    .map((y, index) => y / adjustedXs[index])
    .map((r) => (r < 0 ? 0 : r));
  return { xs: adjustedXs, ys: adjustedYs };
};

const reverseNegativeShape = ({ xs, ys }: XYShape): XYShape => ({
  xs: xs
    .slice()
    .reverse()
    .map((x) => -x),
  ys: ys.slice().reverse(),
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
    adjustedSamples = reverseNegativeSamples(adjustedSamples);
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
 * Removes samples that are 0.
 */
export const logKde = ({
  samples,
  outputLength,
  weight,
  kernelWidth,
}: kdeParams): XYShape => {
  //Note that this process filters out samples that are at exactly 0.
  const singleSideKde = (sign: sign) => {
    let sideSamples =
      sign === "positive"
        ? samples.filter((v) => v > 0)
        : samples.filter((v) => v < 0);

    // We can only approximate a bandwidth if there are at least 2 samples.
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

  const result = {
    xs: [...negativePart.xs, ...positivePart.xs],
    ys: [...negativePart.ys, ...positivePart.ys],
  };
  return result;
};
