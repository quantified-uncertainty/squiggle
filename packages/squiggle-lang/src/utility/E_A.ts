import { Ok, result } from "./result";

export const zip = <A, B>(xs: A[], ys: B[]): [A, B][] => {
  // based on Belt.Array.zip
  const lenX = xs.length;
  const lenY = ys.length;
  const len = lenX < lenY ? lenX : lenY;
  const s = new Array(len);
  for (let i = 0; i < len; i++) {
    s[i] = [xs[i], ys[i]];
  }
  return s;
};

// This is like map, but
// accumulate([1,2,3], (a,b) => a + b) => [1, 3, 6]
export const accumulate = <A>(items: A[], fn: (x: A, y: A) => A): A[] => {
  const len = items.length;
  const result = new Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    const element = items[i];
    if (i === 0) {
      result[i] = element;
    } else {
      result[i] = fn(element, result[i - 1]);
    }
  }
  return result;
};

export const unzip = <A, B>(
  items: readonly (readonly [A, B])[]
): [A[], B[]] => {
  // based on Belt.Array.unzip
  const len = items.length;
  const a1 = new Array(len);
  const a2 = new Array(len);
  for (let i = 0; i < len; i++) {
    const [v1, v2] = items[i];
    a1[i] = v1;
    a2[i] = v2;
  }
  return [a1, a2];
};

export const toRanges = <T>(items: T[]): result<[T, T][], string> => {
  if (items.length < 2) {
    return {
      ok: false,
      value: "Must be at least 2 elements",
    };
  } else {
    return Ok(zip(items, items.slice(1)));
  }
};

export const pairwise = <T, R>(
  items: readonly T[],
  fn: (v1: T, v2: T) => R
): R[] => {
  const result: R[] = [];
  for (let i = 1; i < items.length; i++) {
    result.push(fn(items[i - 1], items[i]));
  }
  return result;
};

export const makeBy = <T>(n: number, fn: (i: number) => T): T[] => {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(fn(i));
  }
  return result;
};
