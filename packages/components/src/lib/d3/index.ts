import * as d3 from "d3";

import { SqScale } from "@quri/squiggle-lang";
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
      return scaleSymlog().constant(scale.constant);
    case "power":
      return scalePow().exponent(scale.exponent);
    case "log":
      return scaleLog();
    default:
      throw new Error(`Unknown scale: ${scale satisfies never}`);
  }
}
