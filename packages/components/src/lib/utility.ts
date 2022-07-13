import { result } from "@quri/squiggle-lang";

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
