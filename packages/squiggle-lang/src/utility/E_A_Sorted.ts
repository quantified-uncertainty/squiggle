// based on E.A.Sorted / utilities for XYShape

// Get the index of the first element greater than `x`.
// If `x` is not greater than any element in `xs`, returns `xs.length`.
export const firstGreaterIndex = (xs: readonly number[], x: number): number => {
  let a = 0,
    b = xs.length;
  while (a < b) {
    const m = Math.floor((a + b) / 2);
    if (xs[m] <= x) {
      a = m + 1;
    } else {
      b = m;
    }
  }
  return a;
};

// based on Jstat.percentile in inclusive mode
export const percentile = (xs: number[], k: number) => {
  const realIndex = k * (xs.length - 1);
  const index = Math.floor(realIndex);
  if (index + 1 < xs.length) {
    const frac = realIndex - index;
    const x0 = xs[index];
    const x1 = xs[index + 1];
    return x0 + frac * (x1 - x0);
  } else {
    return xs[index];
  }
};
