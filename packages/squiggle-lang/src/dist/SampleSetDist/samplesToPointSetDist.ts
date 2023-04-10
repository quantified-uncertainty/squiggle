import { kde } from "./kde.js";
import { XYShape } from "../../XYShape.js";
import { nrd0 } from "./bandwidth.js";
import { splitContinuousAndDiscrete } from "./splitContinuousAndDiscrete.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";

const minDiscreteToKeep = (samples: readonly number[]) =>
  Math.max(20, samples.length / 50);

type ConversionResult = {
  continuousDist: XYShape | undefined;
  discreteDist: XYShape;
};

export const samplesToPointSetDist = (
  samples: readonly number[],
  outputXYPoints: number,
  kernelWidth?: number,
  logTransform: boolean = true,
): ConversionResult => {
  samples = E_A_Floats.sort(samples);

  let { continuousPart, discretePart } = splitContinuousAndDiscrete(
    samples,
    minDiscreteToKeep(samples)
  );

  //WARNING: Needs fix for negative numbers.
  if (logTransform) {
    continuousPart = continuousPart.map(r => {
      if (r == 0) { return 0 }
      return Math.log(r)
    })
  }

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
    if (logTransform) {
      continuousDist = ({
        xs: xs.map(x => Math.exp(x)),
        ys: ys.map((y, index) => {
          let xValue = xs[index];
          return y / Math.exp(xValue)
        })
      });
    } else {
      continuousDist = { xs, ys };
    }
  }

  discretePart.ys = discretePart.ys.map((count: number) => count * pointWeight);

  return {
    continuousDist,
    discreteDist: discretePart,
  };
};
