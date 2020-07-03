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

let makeTestCloseEquality = (~only=false, str, item1, item2, ~digits) =>
  only
    ? Only.test(str, () =>
        expect(item1) |> toBeSoCloseTo(item2, ~digits)
      )
    : test(str, () =>
        expect(item1) |> toBeSoCloseTo(item2, ~digits)
      );

describe("Shape", () => {
  describe("Continuous", () => {
    open Distributions.Continuous;
    let continuous = make(`Linear, shape, None);
    makeTest("minX", T.minX(continuous), 1.0);
    makeTest("maxX", T.maxX(continuous), 8.0);
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
        let continuous = make(`Stepwise, shape, None);
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
          make(`Stepwise, {xs: [|1., 4., 8.|], ys: [|0.1, 5., 1.0|]}, None);
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
        let continuous = make(`Stepwise, {xs: [|0.0|], ys: [|0.3|]}, None);
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
      |> T.normalize //scaleToIntegralSum(~intendedSum=1.0)
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
    let discrete = make(shape, None);
    makeTest("minX", T.minX(discrete), 1.0);
    makeTest("maxX", T.maxX(discrete), 8.0);
    makeTest(
      "mapY",
      T.mapY(r => r *. 2.0, discrete) |> (r => getShape(r).ys),
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
      scaleBy(~scale=4.0, discrete),
      make({xs: [|1., 4., 8.|], ys: [|1.2, 2.0, 0.8|]}, None),
    );
    makeTest(
      "normalize, then scale by 4.0",
      discrete
      |> T.normalize
      |> scaleBy(~scale=4.0),
      make({xs: [|1., 4., 8.|], ys: [|1.2, 2.0, 0.8|]}, None),
    );
    makeTest(
      "scaleToIntegralSum: back and forth",
      discrete
      |> T.normalize
      |> scaleBy(~scale=4.0)
      |> T.normalize,
      discrete,
    );
    makeTest(
      "integral",
      T.Integral.get(~cache=None, discrete),
      Distributions.Continuous.make(
        `Stepwise,
        {xs: [|1., 4., 8.|], ys: [|0.3, 0.8, 1.0|]},
        None
      ),
    );
    makeTest(
      "integral with 1 element",
      T.Integral.get(~cache=None, Distributions.Discrete.make({xs: [|0.0|], ys: [|1.0|]}, None)),
      Distributions.Continuous.make(`Stepwise, {xs: [|0.0|], ys: [|1.0|]}, None),
    );
    makeTest(
      "integralXToY",
      T.Integral.xToY(~cache=None, 6.0, discrete),
      0.9,
    );
    makeTest("integralEndY", T.Integral.sum(~cache=None, discrete), 1.0);
    makeTest("mean", T.mean(discrete), 3.9);
    makeTestCloseEquality(
      "variance",
      T.variance(discrete),
      5.89,
      ~digits=7,
    );
  });

  describe("Mixed", () => {
    open Distributions.Mixed;
    let discreteShape: DistTypes.xyShape = {
      xs: [|1., 4., 8.|],
      ys: [|0.3, 0.5, 0.2|],
    };
    let discrete = Distributions.Discrete.make(discreteShape, None);
    let continuous =
      Distributions.Continuous.make(
        `Linear,
        {xs: [|3., 7., 14.|], ys: [|0.058, 0.082, 0.124|]},
        None
      )
      |> Distributions.Continuous.T.normalize; //scaleToIntegralSum(~intendedSum=1.0);
    let mixed = Distributions.Mixed.make(
        ~continuous,
        ~discrete,
      );
    makeTest("minX", T.minX(mixed), 1.0);
    makeTest("maxX", T.maxX(mixed), 14.0);
    makeTest(
      "mapY",
      T.mapY(r => r *. 2.0, mixed),
      Distributions.Mixed.make(
        ~continuous=
          Distributions.Continuous.make(
            `Linear,
            {
              xs: [|3., 7., 14.|],
              ys: [|
                0.11588411588411589,
                0.16383616383616384,
                0.24775224775224775,
              |],
            },
            None
          ),
        ~discrete=Distributions.Discrete.make({xs: [|1., 4., 8.|], ys: [|0.6, 1.0, 0.4|]}, None)
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
      Distributions.Mixed.scaleBy(~scale=2.0, mixed),
      Distributions.Mixed.make(
        ~continuous=
          Distributions.Continuous.make(
            `Linear,
            {
              xs: [|3., 7., 14.|],
              ys: [|
                0.11588411588411589,
                0.16383616383616384,
                0.24775224775224775,
              |],
            },
            None
          ),
        ~discrete=Distributions.Discrete.make({xs: [|1., 4., 8.|], ys: [|0.6, 1.0, 0.4|]}, None),
      ),
    );
    makeTest(
      "integral",
      T.Integral.get(~cache=None, mixed),
      Distributions.Continuous.make(
        `Linear,
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
      None,
      ),
    );
  });

  describe("Distplus", () => {
    open Distributions.DistPlus;
    let discreteShape: DistTypes.xyShape = {
      xs: [|1., 4., 8.|],
      ys: [|0.3, 0.5, 0.2|],
    };
    let discrete = Distributions.Discrete.make(discreteShape, None);
    let continuous =
      Distributions.Continuous.make(
        `Linear,
        {xs: [|3., 7., 14.|], ys: [|0.058, 0.082, 0.124|]},
        None
      )
      |> Distributions.Continuous.T.normalize; //scaleToIntegralSum(~intendedSum=1.0);
    let mixed =
      Distributions.Mixed.make(
        ~continuous,
        ~discrete,
      );
    let distPlus =
      Distributions.DistPlus.make(
        ~shape=Mixed(mixed),
        ~guesstimatorString=None,
        (),
      );
    makeTest("minX", T.minX(distPlus), 1.0);
    makeTest("maxX", T.maxX(distPlus), 14.0);
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
          `Linear,
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
          None,
        ),
      ),
    );
  });

  describe("Shape", () => {
    let mean = 10.0;
    let stdev = 4.0;
    let variance = stdev ** 2.0;
    let numSamples = 10000;
    open Distributions.Shape;
    let normal: SymbolicTypes.symbolicDist = `Normal({mean, stdev});
    let normalShape = ExpressionTree.toShape(numSamples, `SymbolicDist(normal));
    let lognormal = SymbolicDist.Lognormal.fromMeanAndStdev(mean, stdev);
    let lognormalShape = ExpressionTree.toShape(numSamples, `SymbolicDist(lognormal));

    makeTestCloseEquality(
      "Mean of a normal",
      T.mean(normalShape),
      mean,
      ~digits=2,
    );
    makeTestCloseEquality(
      "Variance of a normal",
      T.variance(normalShape),
      variance,
      ~digits=1,
    );
    makeTestCloseEquality(
      "Mean of a lognormal",
      T.mean(lognormalShape),
      mean,
      ~digits=2,
    );
    makeTestCloseEquality(
      "Variance of a lognormal",
      T.variance(lognormalShape),
      variance,
      ~digits=0,
    );
  });
});
