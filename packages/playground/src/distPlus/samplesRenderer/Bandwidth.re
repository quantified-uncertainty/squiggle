//The math here was taken from https://github.com/jasondavies/science.js/blob/master/src/stats/bandwidth.js

let len = x => E.A.length(x) |> float_of_int;

let iqr = x => {
  Jstat.percentile(x, 0.75, true) -. Jstat.percentile(x, 0.25, true);
};

// Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
let nrd0 = x => {
  let hi = Js_math.sqrt(Jstat.variance(x));
  let lo = Js_math.minMany_float([|hi, iqr(x) /. 1.34|]);
  let e = Js_math.abs_float(x[1]);
  let lo' =
    switch (lo, hi, e) {
    | (lo, _, _) when !Js.Float.isNaN(lo) => lo
    | (_, hi, _) when !Js.Float.isNaN(hi) => hi
    | (_, _, e) when !Js.Float.isNaN(e) => e
    | _ => 1.0
    };
  0.9 *. lo' *. Js.Math.pow_float(~base=len(x), ~exp=-0.2);
};

// Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and Visualization. Wiley.
let nrd = x => {
  let h = iqr(x) /. 1.34;
  1.06
  *. Js.Math.min_float(Js.Math.sqrt(Jstat.variance(x)), h)
  *. Js.Math.pow_float(~base=len(x), ~exp=(-1.0) /. 5.0);
};