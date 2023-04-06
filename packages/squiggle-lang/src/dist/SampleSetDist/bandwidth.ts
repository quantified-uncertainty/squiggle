import * as E_A_Sorted from "../../utility/E_A_Sorted.js";
import * as E_A_Floats from "../../utility/E_A_Floats.js";

// Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
// Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and Visualization. Wiley.
const iqr_percentile = 0.75;
const iqr_percentile_complement = 1 - iqr_percentile;
const nrd0_lo_denominator = 1.34;
const one = 1.0;
const nrd0_coef = 0.9;

const nrd_coef = 1.06;
const nrd_fractionalPower = -0.2;

const iqr = (x: number[]) =>
  E_A_Sorted.percentile(x, iqr_percentile) -
  E_A_Sorted.percentile(x, iqr_percentile_complement);

// Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
export const nrd0 = (x: number[]) => {
  const hi = Math.sqrt(E_A_Floats.variance(x));
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
    Math.min(Math.sqrt(E_A_Floats.variance(x)), h) *
    Math.pow(x.length, nrd_fractionalPower)
  );
};
