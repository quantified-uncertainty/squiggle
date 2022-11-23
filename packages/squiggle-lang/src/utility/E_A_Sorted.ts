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
