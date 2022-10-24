//The math here was taken from https://github.com/jasondavies/science.js/blob/master/src/stats/SampleSetDist_Bandwidth.js
let {iqr_percentile, nrd0_lo_denominator, one, nrd0_coef, nrd_coef, nrd_fractionalPower} = module(
  MagicNumbers.SampleSetBandwidth
)
let len = x => E.A.length(x)->float_of_int

let iqr = x =>
  Jstat.percentile(x, iqr_percentile, true) -. Jstat.percentile(x, 1.0 -. iqr_percentile, true)

// Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
let nrd0 = x => {
  let hi = Js_math.sqrt(Jstat.variance(x))
  let lo = Js_math.minMany_float([hi, iqr(x) /. nrd0_lo_denominator])
  let e = Js_math.abs_float(x[1])
  let lo' = switch (lo, hi, e) {
  | (lo, _, _) if !Js.Float.isNaN(lo) => lo
  | (_, hi, _) if !Js.Float.isNaN(hi) => hi
  | (_, _, e) if !Js.Float.isNaN(e) => e
  | _ => one
  }
  nrd0_coef *. lo' *. Js.Math.pow_float(~base=len(x), ~exp=nrd_fractionalPower)
}

// Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and Visualization. Wiley.
let nrd = x => {
  let h = iqr(x) /. nrd0_lo_denominator
  nrd_coef *.
  Js.Math.min_float(Js.Math.sqrt(Jstat.variance(x)), h) *.
  Js.Math.pow_float(~base=len(x), ~exp=nrd_fractionalPower)
}
