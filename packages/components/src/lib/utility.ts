import { result, resultMap, SqValueTag } from "@quri/squiggle-lang";
import { ResultAndBindings } from "./hooks/useSquiggle";

export function flattenResult<a, b>(x: result<a, b>[]): result<a[], b> {
  if (x.length === 0) {
    return { tag: "Ok", value: [] };
  } else {
    if (x[0].tag === "Error") {
      return x[0];
    } else {
      let rest = flattenResult(x.splice(1));
      if (rest.tag === "Error") {
        return rest;
      } else {
        return { tag: "Ok", value: [x[0].value].concat(rest.value) };
      }
    }
  }
}

export function resultBind<a, b, c>(
  x: result<a, b>,
  fn: (y: a) => result<c, b>
): result<c, b> {
  if (x.tag === "Ok") {
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

export function getValueToRender({ result, bindings }: ResultAndBindings) {
  return resultMap(result, (value) =>
    value.tag === SqValueTag.Void ? bindings.asValue() : value
  );
}

export function getErrorLocations(result: ResultAndBindings["result"]) {
  if (result.tag === "Error") {
    const location = result.value.location();
    return location ? [location] : [];
  } else {
    return [];
  }
}
