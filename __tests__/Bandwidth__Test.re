open Jest;
open Expect;

[@bs.val] [@bs.module "science"] [@bs.scope "stats"]
external variance: array(float) => float = "variance";

[@bs.val] [@bs.module "science"] [@bs.scope "stats"]
external iqr: array(float) => float = "iqr";

let len = x => E.A.length(x) |> float_of_int;

let nrd0 = x => {
  let hi = Js_math.sqrt(variance(x));
  let lo = Js_math.minMany_float([|hi, iqr(x) /. 1.34|]);
  let e = Js_math.abs_float(x[1]);
  let lo' =
    switch (lo, hi, e) {
    | (lo, hi, e) when !Js.Float.isNaN(lo) => lo
    | (lo, hi, e) when !Js.Float.isNaN(hi) => hi
    | (lo, hi, e) when !Js.Float.isNaN(e) => e
    | _ => 1.0
    };
  0.9 *. lo' *. Js_math.pow_float(len(x), -0.2);
};

let nrd = x => {
  let h = iqr(x) /. 1.34;
  1.06
  *. Js_math.min_float(Js_math.sqrt(variance(x)), h)
  *. Js_math.pow_float(len(x), (-1.0) /. 5.0);
};

describe("Bandwidth", () => {
  test("nrd0 1", () => {
    let data = [|1., 4., 3., 2.|];
    expect(nrd0(data)) |> toEqual(0.7635139420854616);
  });
  test("nrd0 2", () => {
    let data = [|1., 4., 3., 2.|];
    expect(nrd(data)) |> toEqual(0.899249754011766);
  });
});