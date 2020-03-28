open Jest;
open Expect;

let shape: DistTypes.xyShape = {xs: [|1., 4., 8.|], ys: [|8., 9., 2.|]};

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () =>
        expect(item1) |> toEqual(item2)
      )
    : test(str, () =>
        expect(item1) |> toEqual(item2)
      );

describe("Shape", () => {
  describe("Continuous", () => {
    open Distributions.Continuous;
    let continuous = make(shape, `Linear);
    makeTest("minX", T.minX(continuous), Some(1.0));
    makeTest("maxX", T.maxX(continuous), Some(8.0));
    makeTest(
      "mapY",
      T.mapY(r => r *. 2.0, continuous) |> getShape |> (r => r.ys),
      [|16., 18.0, 4.0|],
    );
    describe("xToY", () => {
      describe("when Linear", () => {
        makeTest(
          "at 4.0",
          T.xToY(4., continuous),
          {continuous: 9.0, discrete: 0.0},
        );
        // Note: This below is weird to me, I'm not sure if it's what we want really.
        makeTest(
          "at 0.0",
          T.xToY(0., continuous),
          {continuous: 8.0, discrete: 0.0},
        );
        makeTest(
          "at 5.0",
          T.xToY(5., continuous),
          {continuous: 7.25, discrete: 0.0},
        );
        makeTest(
          "at 10.0",
          T.xToY(10., continuous),
          {continuous: 2.0, discrete: 0.0},
        );
      });
      describe("when Stepwise", () => {
        let continuous = make(shape, `Stepwise);
        makeTest(
          "at 4.0",
          T.xToY(4., continuous),
          {continuous: 9.0, discrete: 0.0},
        );
        makeTest(
          "at 0.0",
          T.xToY(0., continuous),
          {continuous: 0.0, discrete: 0.0},
        );
        makeTest(
          "at 5.0",
          T.xToY(5., continuous),
          {continuous: 9.0, discrete: 0.0},
        );
        makeTest(
          "at 10.0",
          T.xToY(10., continuous),
          {continuous: 2.0, discrete: 0.0},
        );
      });
    });
    makeTest(
      "integral",
      T.Integral.get(~cache=None, continuous) |> getShape,
      {xs: [|1.0, 4.0, 8.0|], ys: [|0.0, 25.5, 47.5|]},
    );
    makeTest(
      "toLinear",
      {
        let continuous =
          make({xs: [|1., 4., 8.|], ys: [|0.1, 5., 1.0|]}, `Stepwise);
        continuous |> toLinear |> E.O.fmap(getShape);
      },
      Some({
        xs: [|1.00007, 1.00007, 4.0, 4.00007, 8.0, 8.00007|],
        ys: [|0.0, 0.1, 0.1, 5.0, 5.0, 1.0|],
      }),
    );
    makeTest(
      "toLinear",
      {
        let continuous = make({xs: [|0.0|], ys: [|0.3|]}, `Stepwise);
        continuous |> toLinear |> E.O.fmap(getShape);
      },
      Some({xs: [|0.0|], ys: [|0.3|]}),
    );
    makeTest(
      "integralXToY",
      T.Integral.xToY(~cache=None, 0.0, continuous),
      0.0,
    );
    makeTest(
      "integralXToY",
      T.Integral.xToY(~cache=None, 2.0, continuous),
      8.5,
    );
    makeTest(
      "integralXToY",
      T.Integral.xToY(~cache=None, 100.0, continuous),
      47.5,
    );
    makeTest(
      "integralEndY",
      continuous
      |> T.scaleToIntegralSum(~intendedSum=1.0)
      |> T.Integral.sum(~cache=None),
      1.0,
    );
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
      "mapY",
      T.mapY(r => r *. 2.0, discrete) |> (r => r.ys),
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
      "scaleBy",
      T.scaleBy(~scale=4.0, discrete),
      {xs: [|1., 4., 8.|], ys: [|1.2, 2.0, 0.8|]},
    );
    makeTest(
      "scaleToIntegralSum",
      T.scaleToIntegralSum(~intendedSum=4.0, discrete),
      {xs: [|1., 4., 8.|], ys: [|1.2, 2.0, 0.8|]},
    );
    makeTest(
      "scaleToIntegralSum: back and forth",
      discrete
      |> T.scaleToIntegralSum(~intendedSum=4.0)
      |> T.scaleToIntegralSum(~intendedSum=1.0),
      discrete,
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
      "integral with 1 element",
      T.Integral.get(~cache=None, {xs: [|0.0|], ys: [|1.0|]}),
      Distributions.Continuous.make({xs: [|0.0|], ys: [|1.0|]}, `Stepwise),
    );
    makeTest(
      "integralXToY",
      T.Integral.xToY(~cache=None, 6.0, discrete),
      0.9,
    );
    makeTest("integralEndY", T.Integral.sum(~cache=None, discrete), 1.0);
  });

  describe("Mixed", () => {
    open Distributions.Mixed;
    let discrete: DistTypes.xyShape = {
      xs: [|1., 4., 8.|],
      ys: [|0.3, 0.5, 0.2|],
    };
    let continuous =
      Distributions.Continuous.make(
        {xs: [|3., 7., 14.|], ys: [|0.058, 0.082, 0.124|]},
        `Linear,
      )
      |> Distributions.Continuous.T.scaleToIntegralSum(~intendedSum=1.0);
    let mixed =
      MixedShapeBuilder.build(
        ~continuous,
        ~discrete,
        ~assumptions={
          continuous: ADDS_TO_CORRECT_PROBABILITY,
          discrete: ADDS_TO_CORRECT_PROBABILITY,
          discreteProbabilityMass: Some(0.5),
        },
      )
      |> E.O.toExn("");
    makeTest("minX", T.minX(mixed), Some(1.0));
    makeTest("maxX", T.maxX(mixed), Some(14.0));
    makeTest(
      "mapY",
      T.mapY(r => r *. 2.0, mixed),
      Distributions.Mixed.make(
        ~continuous=
          Distributions.Continuous.make(
            {
              xs: [|3., 7., 14.|],
              ys: [|
                0.11588411588411589,
                0.16383616383616384,
                0.24775224775224775,
              |],
            },
            `Linear,
          ),
        ~discrete={xs: [|1., 4., 8.|], ys: [|0.6, 1.0, 0.4|]},
        ~discreteProbabilityMassFraction=0.5,
      ),
    );
    makeTest(
      "xToY at 4.0",
      T.xToY(4., mixed),
      {discrete: 0.25, continuous: 0.03196803196803197},
    );
    makeTest(
      "xToY at 0.0",
      T.xToY(0., mixed),
      {discrete: 0.0, continuous: 0.028971028971028972},
    );
    makeTest(
      "xToY at 5.0",
      T.xToY(7., mixed),
      {discrete: 0.0, continuous: 0.04095904095904096},
    );
    makeTest("integralEndY", T.Integral.sum(~cache=None, mixed), 1.0);
    makeTest(
      "scaleBy",
      T.scaleBy(~scale=2.0, mixed),
      Distributions.Mixed.make(
        ~continuous=
          Distributions.Continuous.make(
            {
              xs: [|3., 7., 14.|],
              ys: [|
                0.11588411588411589,
                0.16383616383616384,
                0.24775224775224775,
              |],
            },
            `Linear,
          ),
        ~discrete={xs: [|1., 4., 8.|], ys: [|0.6, 1.0, 0.4|]},
        ~discreteProbabilityMassFraction=0.5,
      ),
    );
    makeTest(
      "integral",
      T.Integral.get(~cache=None, mixed),
      Distributions.Continuous.make(
        {
          xs: [|1.00007, 1.00007, 3., 4., 4.00007, 7., 8., 8.00007, 14.|],
          ys: [|
            0.0,
            0.0,
            0.15,
            0.18496503496503497,
            0.4349674825174825,
            0.5398601398601399,
            0.5913086913086913,
            0.6913122927072927,
            1.0,
          |],
        },
        `Linear,
      ),
    );
  });

  describe("Mixed", () => {
    open Distributions.DistPlus;
    let discrete: DistTypes.xyShape = {
      xs: [|1., 4., 8.|],
      ys: [|0.3, 0.5, 0.2|],
    };
    let continuous =
      Distributions.Continuous.make(
        {xs: [|3., 7., 14.|], ys: [|0.058, 0.082, 0.124|]},
        `Linear,
      )
      |> Distributions.Continuous.T.scaleToIntegralSum(~intendedSum=1.0);
    let mixed =
      MixedShapeBuilder.build(
        ~continuous,
        ~discrete,
        ~assumptions={
          continuous: ADDS_TO_CORRECT_PROBABILITY,
          discrete: ADDS_TO_CORRECT_PROBABILITY,
          discreteProbabilityMass: Some(0.5),
        },
      )
      |> E.O.toExn("");
    let distPlus =
      Distributions.DistPlus.make(
        ~shape=Mixed(mixed),
        ~guesstimatorString=None,
        (),
      );
    makeTest("minX", T.minX(distPlus), Some(1.0));
    makeTest("maxX", T.maxX(distPlus), Some(14.0));
    makeTest(
      "xToY at 4.0",
      T.xToY(4., distPlus),
      {discrete: 0.25, continuous: 0.03196803196803197},
    );
    makeTest(
      "xToY at 0.0",
      T.xToY(0., distPlus),
      {discrete: 0.0, continuous: 0.028971028971028972},
    );
    makeTest(
      "xToY at 5.0",
      T.xToY(7., distPlus),
      {discrete: 0.0, continuous: 0.04095904095904096},
    );
    makeTest("integralEndY", T.Integral.sum(~cache=None, distPlus), 1.0);
    makeTest(
      "integral",
      T.Integral.get(~cache=None, distPlus) |> T.toContinuous,
      Some(
        Distributions.Continuous.make(
          {
            xs: [|1.00007, 1.00007, 3., 4., 4.00007, 7., 8., 8.00007, 14.|],
            ys: [|
              0.0,
              0.0,
              0.15,
              0.18496503496503497,
              0.4349674825174825,
              0.5398601398601399,
              0.5913086913086913,
              0.6913122927072927,
              1.0,
            |],
          },
          `Linear,
        ),
      ),
    );
  });
});