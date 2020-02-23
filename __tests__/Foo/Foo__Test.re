open Jest;
open Expect;

let shape: DistTypes.xyShape = {xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]};

let makeTest = (str, item1, item2) =>
  test(str, () =>
    expect(item1) |> toEqual(item2)
  );

describe("Shape", () => {
  describe("Continuous", () => {
    open Distributions.Continuous;
    let continuous = make(shape, `Stepwise);
    makeTest("minX", T.minX(continuous), Some(1.0));
    makeTest("maxX", T.maxX(continuous), Some(8.0));
    makeTest(
      "pointwiseFmap",
      T.pointwiseFmap(r => r *. 2.0, continuous) |> getShape |> (r => r.ys),
      [|16., 18.0, 4.0|],
    );
    makeTest(
      "xToY at 4.0",
      T.xToY(4., continuous),
      {continuous: 9.0, discrete: 0.0},
    );
    makeTest(
      "xToY at 0.0",
      T.xToY(0., continuous),
      {continuous: 8.0, discrete: 0.0},
    );
    makeTest(
      "xToY at 5.0",
      T.xToY(5., continuous),
      {continuous: 7.25, discrete: 0.0},
    );
    makeTest(
      "integral",
      T.Integral.get(~cache=None, continuous) |> getShape,
      {xs: [|4.0, 8.0|], ys: [|25.5, 47.5|]},
    );
    makeTest(
      "integralXToY",
      T.Integral.xToY(~cache=None, 2.0, continuous),
      25.5,
    );
    makeTest("integralSum", T.Integral.sum(~cache=None, continuous), 73.0);
  });

  describe("Discrete", () => {
    open Distributions.Discrete;
    let shape: DistTypes.xyShape = {
      xs: [|1., 4., 8.|],
      ys: [|0.3, 0.5, 0.2|],
    };
    let discrete = shape;
    makeTest("minX", T.minX(discrete), Some(1.0));
    makeTest("maxX", T.maxX(discrete), Some(8.0));
    makeTest(
      "pointwiseFmap",
      T.pointwiseFmap(r => r *. 2.0, discrete) |> (r => r.ys),
      [|0.6, 1.0, 0.4|],
    );
    makeTest(
      "xToY at 4.0",
      T.xToY(4., discrete),
      {discrete: 0.5, continuous: 0.0},
    );
    makeTest(
      "xToY at 0.0",
      T.xToY(0., discrete),
      {discrete: 0.0, continuous: 0.0},
    );
    makeTest(
      "xToY at 5.0",
      T.xToY(5., discrete),
      {discrete: 0.0, continuous: 0.0},
    );
    makeTest(
      "integral",
      T.Integral.get(~cache=None, discrete),
      Distributions.Continuous.make(
        {xs: [|1., 4., 8.|], ys: [|0.3, 0.8, 1.0|]},
        `Stepwise,
      ),
    );
    makeTest(
      "integralXToY",
      T.Integral.xToY(~cache=None, 6.0, discrete),
      0.9,
    );
    makeTest("integralSum", T.Integral.sum(~cache=None, discrete), 1.0);
  });
});