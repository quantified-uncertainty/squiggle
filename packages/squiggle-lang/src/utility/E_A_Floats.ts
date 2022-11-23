import isInteger from "lodash/isInteger";

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
