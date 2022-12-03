import isInteger from "lodash/isInteger";
import * as E_A from "./E_A";

class RangeError extends Error {}

export const range = (min: number, max: number, n: number): number[] => {
  if (!isInteger(n)) {
    throw new Error("n must be integer");
  }
  if (n === 0) {
    return [];
  } else if (n === 1) {
    return [min];
  } else if (n === 2) {
    return [min, max];
  } else if (n < 0) {
    throw new RangeError("n must be greater than 0");
  } else if (min === max) {
    return new Array(n).fill(min);
  } else if (min > max) {
    throw new RangeError("Min value is higher then max value");
  } else {
    const diff = (max - min) / (n - 1);
    const result: number[] = [];
    for (let i = 0; i < n; i++) {
      result.push(min + i * diff);
    }
    return result;
  }
};

// must be strictly growing - based on E.A.Floats
export const isSorted = (t: number[]): boolean => {
  if (t.length <= 1) {
    return true;
  }

  for (let i = 0; i < t.length; i++) {
    if (t[i] >= t[i + 1]) {
      return false;
    }
  }
  return true;
};

export const sum = (t: readonly number[]): number => {
  let sum = 0;
  for (let v of t) {
    sum += v;
  }
  return sum;
};

export const product = (t: readonly number[]): number => {
  // based on jstat.product
  let prod = 1;
  let i = t.length;
  while (--i >= 0) {
    prod *= t[i];
  }
  return prod;
};

export const mean = (t: readonly number[]): number => {
  return sum(t) / t.length; // TODO - handle empty arrays?
};

// geometric mean
// based on jstat.geomean
export const geomean = (t: readonly number[]): number => {
  return Math.pow(product(t), 1 / t.length);
};

export const percentile = (t: readonly number[]): number => {
  return sum(t) / t.length; // TODO - handle empty arrays?
};

export const sort = (t: readonly number[]): number[] => {
  return Array.from(new Float64Array(t).sort());
};

export const variance = (xs: readonly number[]) => {
  // Variance is shift-invariant; subtract the middle of the range for precision
  // https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Computing_shifted_data
  const n = xs.length;
  const offset = (xs[0] + xs[n - 1]) / 2;
  let sum = 0;
  let sumsq = 0;
  for (let i = 0; i < n; i++) {
    const xOffset = xs[i] - offset;
    sum += xOffset;
    sumsq += xOffset * xOffset;
  }
  const mean = sum / n;
  return sumsq / n - mean * mean;
};

export const stdev = (t: readonly number[]) => Math.sqrt(variance(t));

// This is like map, but
//[1,2,3]->accumulate((a,b) => a + b) => [1, 3, 6]
const accumulate = (
  items: readonly number[],
  fn: (a: number, b: number) => number
) => {
  const length = items.length;
  const result: number[] = new Array(length);
  for (let i = 0; i < length; i++) {
    if (i === 0) {
      result[i] = items[0];
    } else {
      result[i] = fn(items[i], result[i - 1]);
    }
  }
  return result;
};

export const cumSum = (t: readonly number[]): number[] => {
  return accumulate(t, (a, b) => a + b);
};

export const cumProd = (t: readonly number[]): number[] => {
  return accumulate(t, (a, b) => a * b);
};

// Gives an array with all the differences between values
// diff([1,5,3,7]) = [4,-2,4]
export const diff = (t: readonly number[]): number[] => {
  return E_A.pairwise(t, (left, right) => right - left);
};
