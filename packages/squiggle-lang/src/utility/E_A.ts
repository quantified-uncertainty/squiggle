import { Ok, result } from "./result.js";

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
export const accumulate = <A>(
  items: readonly A[],
  fn: (x: A, y: A) => A
): A[] => {
  const len = items.length;
  if (len === 0) return [];
  const result = new Array(len);
  result[0] = items[0]; // handle the first element separately

  for (let i = 1; i < len; i++) {
    result[i] = fn(items[i], result[i - 1]);
  }

  return result;
};

export const accumulateWithError = <A, E>(
  items: readonly A[],
  fn: (x: A, y: A) => result<A, E>
): result<A[], E> => {
  const len = items.length;
  if (len === 0) return Ok([]);
  const results: A[] = new Array(len);
  results[0] = items[0]; // First element is directly assigned

  for (let i = 1; i < len; i++) {
    const r: result<A, E> = fn(items[i], results[i - 1]);
    if (!r.ok) return r; // Early return on error
    results[i] = r.value;
  }

  return Ok(results);
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

export const pairwiseWithError = <T, R, E>(
  items: readonly T[],
  fn: (v1: T, v2: T) => result<R, E>
): result<R[], E> => {
  const result: R[] = [];
  for (let i = 1; i < items.length; i++) {
    const r: result<R, E> = fn(items[i - 1], items[i]);
    if (!r.ok) return r; // Immediately return on error
    result.push(r.value);
  }
  return Ok(result);
};

export const makeBy = <T>(n: number, fn: (i: number) => T): T[] => {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(fn(i));
  }
  return result;
};

export function shuffle<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

export function isEqual<T>(arr1: readonly T[], arr2: readonly T[]): boolean {
  // If lengths of the arrays are different, they are not equal
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}
