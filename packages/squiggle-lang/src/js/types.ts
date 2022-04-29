export type result<a, b> =
  | {
      tag: "Ok";
      value: a;
    }
  | {
      tag: "Error";
      value: b;
    };

export function resultMap<a, b, c>(
  r: result<a, c>,
  mapFn: (x: a) => b
): result<b, c> {
  if (r.tag === "Ok") {
    return { tag: "Ok", value: mapFn(r.value) };
  } else {
    return r;
  }
}

export function Ok<a, b>(x: a): result<a, b> {
  return { tag: "Ok", value: x };
}

export type tagged<a, b> = { tag: a; value: b };

export function tag<a, b>(x: a, y: b): tagged<a, b> {
  return { tag: x, value: y };
}
