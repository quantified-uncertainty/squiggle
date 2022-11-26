import { result } from "../rescript/ForTS/ForTS_Result_tag";
import { rsResult } from "../rsResult";
export { result };

export function resultMap<a, b, c>(
  r: result<a, b>,
  mapValue: (x: a) => c
): result<c, b> {
  if (r.tag === "Ok") {
    return { tag: "Ok", value: mapValue(r.value) };
  } else {
    return { tag: "Error", value: r.value };
  }
}

export function fromRSResult<A, B>(r: rsResult<A, B>): result<A, B> {
  return r.TAG === 0
    ? {
        tag: "Ok",
        value: r._0,
      }
    : {
        tag: "Error",
        value: r._0,
      };
}

export function resultMapError<a, b, c>(
  r: result<a, b>,
  mapError: (y: b) => c
): result<a, c> {
  if (r.tag === "Ok") {
    return { tag: "Ok", value: r.value };
  } else {
    return { tag: "Error", value: mapError(r.value) };
  }
}

export function resultMap2<a, b, c, d>(
  r: result<a, b>,
  mapValue: (x: a) => c,
  mapError: (y: b) => d
): result<c, d> {
  if (r.tag === "Ok") {
    return { tag: "Ok", value: mapValue(r.value) };
  } else {
    return { tag: "Error", value: mapError(r.value) };
  }
}

export function Ok<a, b>(x: a): result<a, b> {
  return { tag: "Ok", value: x };
}

// Error is taken by JS's native exception type
export function Error_<a, b>(x: b): result<a, b> {
  return { tag: "Error", value: x };
}
