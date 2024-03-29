import * as d3 from "d3";

import {
  SCALE_POWER_DEFAULT_CONSTANT,
  SCALE_SYMLOG_DEFAULT_CONSTANT,
  SqScale,
} from "@quri/squiggle-lang";

import { DEFAULT_DATE_FORMAT } from "../constants.js";
import {
  scaleDate,
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
  const method = scale.method;
  if (!method) return scaleLinear();
  switch (method.type) {
    case "linear":
      return scaleLinear();
    case "symlog":
      return scaleSymlog().constant(
        method.constant || SCALE_SYMLOG_DEFAULT_CONSTANT
      );
    case "power":
      return scalePow().exponent(
        method.exponent || SCALE_POWER_DEFAULT_CONSTANT
      );
    case "log":
      return scaleLog();
    case "date":
      return scaleDate();
  }
}

export function formatNumber(format: string, num: number) {
  return d3.format(format)(num);
}

export function formatDate(date: Date, format?: string) {
  return d3.timeFormat(format || DEFAULT_DATE_FORMAT)(date);
}
