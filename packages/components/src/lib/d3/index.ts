import * as d3 from "d3";

import { SqScale, SqShape } from "@quri/squiggle-lang";
import {
  scaleLinear,
  scaleLog,
  scalePow,
  scaleSymlog,
} from "./patchedScales.js";

export function sqScaleToD3(
  scale: SqScale
): d3.ScaleContinuousNumeric<number, number, never> {
  // Note that we don't set the domain here based on scale.max/scale.min.
  // That's because the domain can depend on the data that we draw, so that part is done later.

  // See also: `scaleTypeToSqScale` function in PlaygroundSettingsForm, for default scales we create when SqScale is not provided.
  switch (scale.tag) {
    case "linear":
      return scaleLinear();
    case "symlog":
      return scaleSymlog().constant(1);
    case "power":
      return scalePow().exponent(scale.exponent);
    case "log":
      return scaleLog();
    default:
      throw new Error(`Unknown scale: ${scale satisfies never}`);
  }
}

/**
 * A function to adjust the height of PDF values in accordance with non-linear scales.
 * This is achieved by multiplying the values by the inverse of the derivative of the scale function at each point.
 * The adjustment allows the PDF values to be more representative of the underlying data,
 * providing a better fit for a histogram representation of the data with the given scales.
 */
function pdfScaleHeightAdjustment(
  scale: SqScale
): (x: number, y: number) => number {
  switch (scale.tag) {
    case "linear":
      return (_, y) => y;
    case "symlog":
    case "log":
      // Technically, we should also muliply by the log of the base of the log scale.
      // However, this is a constant, and we don't show the y-axis anyway.
      // Also, the value for symlog should be slightly different from log, but we ignore that for now.
      return (x, y) => y * Math.abs(x);
    case "power":
      return (x, y) => y * Math.pow(x, 1 - scale._value.exponent);
  }
}

/**
 * A function to adjust the height of PDF values to match the given scale.
 * This function should exclusively be used for probability density functions (PDFs),
 * not cumulative density functions (CDFs) or other shapes.
 *
 */
export function adjustPdfHeightToScale(
  { continuous, discrete }: SqShape,
  scale: SqScale
): SqShape {
  //There's no change for linear scales
  if (scale.tag === "linear") {
    return { continuous, discrete };
  } else {
    const adjustment = pdfScaleHeightAdjustment(scale);
    return {
      discrete: discrete,
      continuous: continuous.map(({ x, y }) => ({ x, y: adjustment(x, y) })),
    };
  }
}
