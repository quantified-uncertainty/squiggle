// Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
// Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and Visualization. Wiley.
const iqr_percentile = 0.75;
const iqr_percentile_complement = 1 - iqr_percentile;
const nrd0_lo_denominator = 1.34;
const one = 1.0;
const nrd0_coef = 0.9;

const nrd_coef = 1.06;
const nrd_fractionalPower = -0.2;

// Stats utilities, valid on sorted arguments only!
// TODO - move `percentile` and `variance` to a common module
const percentile = (xs: number[], k: number) => {
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

const variance = (xs: number[]) => {
  // Variance is shift-invariant; subtract the middle of the range for precision
  // https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Computing_shifted_data
  const n = xs.length;
  const offset = (xs[0] + xs[n - 1]) / 2;
  let sum = 0;
  let sumsq = 0;
  xs.forEach((x) => {
    let xOffset = x - offset;
    sum += xOffset;
    sumsq += xOffset * xOffset;
  });
  const mean = sum / n;
  return sumsq / n - mean * mean;
};

const iqr = (x: number[]) =>
  percentile(x, iqr_percentile) - percentile(x, iqr_percentile_complement);

// Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
export const nrd0 = (x: number[]) => {
  const hi = Math.sqrt(variance(x));
  const lo = Math.min(hi, iqr(x) / nrd0_lo_denominator);
  const e = Math.abs(x[1]);
  const loPrime = !isNaN(lo) ? lo : !isNaN(hi) ? hi : !isNaN(e) ? e : one;
  return nrd0_coef * loPrime * Math.pow(x.length, nrd_fractionalPower);
};

// Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and Visualization. Wiley.
export const nrd = (x: number[]) => {
  const h = iqr(x) / nrd0_lo_denominator;
  return (
    nrd_coef *
    Math.min(Math.sqrt(variance(x)), h) *
    Math.pow(x.length, nrd_fractionalPower)
  );
};
