import { result } from "../rescript/ForTS/ForTS_Result_tag";
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

export type tagged<a, b> = { tag: a; value: b };

export function tag<a, b>(x: a, y: b): tagged<a, b> {
  return { tag: x, value: y };
}
