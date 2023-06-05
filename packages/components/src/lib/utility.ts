import {
  SqError,
  SqScale,
  SqValue,
  result,
  resultMap,
} from "@quri/squiggle-lang";
import * as d3 from "d3";

import { ResultAndBindings } from "./hooks/useSquiggle.js";

export function flattenResult<a, b>(x: result<a, b>[]): result<a[], b> {
  if (x.length === 0) {
    return { ok: true, value: [] };
  } else {
    if (!x[0].ok) {
      return x[0];
    }
    const rest = flattenResult(x.splice(1));
    if (!rest.ok) {
      return rest;
    }
    return { ok: true, value: [x[0].value].concat(rest.value) };
  }
}

export function resultBind<a, b, c>(
  x: result<a, b>,
  fn: (y: a) => result<c, b>
): result<c, b> {
  if (x.ok) {
    return fn(x.value);
  } else {
    return x;
  }
}

export function all(arr: boolean[]): boolean {
  return arr.reduce((x, y) => x && y, true);
}

export function some(arr: boolean[]): boolean {
  return arr.reduce((x, y) => x || y, false);
}

export function getValueToRender({
  result,
  bindings,
}: ResultAndBindings): result<SqValue, SqError> {
  return resultMap(result, (value) =>
    value.tag === "Void" ? bindings.asValue() : value
  );
}

export function getErrors(result: ResultAndBindings["result"]) {
  if (!result.ok) {
    return [result.value];
  } else {
    return [];
  }
}

export function sqScaleToD3(
  scale: SqScale
): d3.ScaleContinuousNumeric<number, number, never> {
  // Note that we don't set the domain here based on scale.max/scale.min.
  // That's because the domain can depend on the data that we draw, so that part is done later.

  // See also: `scaleTypeToSqScale` function in PlaygroundSettingsForm, for default scales we create when SqScale is not provided.
  switch (scale.tag) {
    case "linear":
      return d3.scaleLinear();
    case "log":
      return d3.scaleLog();
    case "symlog":
      return d3.scaleSymlog().constant(1);
    case "power":
      return d3.scalePow().exponent(scale.exponent);
    default:
      throw new Error(`Unsupported scale type ${(scale as any).tag}`);
  }
}

export function isMac() {
  // Browser-only. Defaults to `false` when `window` is not available.

  // TODO - support https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/platform
  // when it will become available in Typescript types.
  // Note: MacIntel is valid even for ARM macs.
  return typeof window !== "undefined" &&
    window.navigator.platform === "MacIntel"
    ? "Cmd+Enter"
    : "Ctrl+Enter";
}
