open PointSetTypes;

type t = PointSetTypes.distPlus;

let shapeIntegral = shape => Shape.T.Integral.get(shape);
let make =
    (
      ~shape,
      ~squiggleString,
      ~domain=Complete,
      ~unit=UnspecifiedDistribution,
      (),
    )
    : t => {
  let integral = shapeIntegral(shape);
  {shape, domain, integralCache: integral, unit, squiggleString};
};

let update =
    (
      ~shape=?,
      ~integralCache=?,
      ~domain=?,
      ~unit=?,
      ~squiggleString=?,
      t: t,
    ) => {
  shape: E.O.default(t.shape, shape),
  integralCache: E.O.default(t.integralCache, integralCache),
  domain: E.O.default(t.domain, domain),
  unit: E.O.default(t.unit, unit),
  squiggleString: E.O.default(t.squiggleString, squiggleString),
};

let updateShape = (shape, t) => {
  let integralCache = shapeIntegral(shape);
  update(~shape, ~integralCache, t);
};

let domainIncludedProbabilityMass = (t: t) =>
  Domain.includedProbabilityMass(t.domain);

let domainIncludedProbabilityMassAdjustment = (t: t, f) =>
  f *. Domain.includedProbabilityMass(t.domain);

let toShape = ({shape, _}: t) => shape;

let shapeFn = (fn, {shape}: t) => fn(shape);

module T =
  Distributions.Dist({
    type t = PointSetTypes.distPlus;
    type integral = PointSetTypes.distPlus;
    let toShape = toShape;
    let toContinuous = shapeFn(Shape.T.toContinuous);
    let toDiscrete = shapeFn(Shape.T.toDiscrete);

    let normalize = (t: t): t => {
      let normalizedShape = t |> toShape |> Shape.T.normalize;
      t |> updateShape(normalizedShape);
    };

    let truncate = (leftCutoff, rightCutoff, t: t): t => {
      let truncatedShape =
        t
        |> toShape
        |> Shape.T.truncate(leftCutoff, rightCutoff);

      t |> updateShape(truncatedShape);
    };

    let xToY = (f, t: t) =>
      t
      |> toShape
      |> Shape.T.xToY(f)
      |> MixedPoint.fmap(domainIncludedProbabilityMassAdjustment(t));

    let minX = shapeFn(Shape.T.minX);
    let maxX = shapeFn(Shape.T.maxX);
    let toDiscreteProbabilityMassFraction =
      shapeFn(Shape.T.toDiscreteProbabilityMassFraction);

    // This bit is kind of awkward, could probably use rethinking.
    let integral = (t: t) =>
      updateShape(Continuous(t.integralCache), t);

    let updateIntegralCache = (integralCache: option<PointSetTypes.continuousShape>, t) =>
      update(~integralCache=E.O.default(t.integralCache, integralCache), t);

    let downsample = (i, t): t =>
      updateShape(t |> toShape |> Shape.T.downsample(i), t);
    // todo: adjust for limit, maybe?
    let mapY =
        (
          ~integralSumCacheFn=previousIntegralSum => None,
          ~integralCacheFn=previousIntegralCache => None,
          ~fn,
          {shape, _} as t: t,
        )
        : t =>
      Shape.T.mapY(~integralSumCacheFn, ~fn, shape)
      |> updateShape(_, t);

    // get the total of everything
    let integralEndY = (t: t) => {
      Shape.T.Integral.sum(
        toShape(t),
      );
    };

    //   TODO: Fix this below, obviously. Adjust for limits
    let integralXtoY = (f, t: t) => {
      Shape.T.Integral.xToY(
        f,
        toShape(t),
      )
      |> domainIncludedProbabilityMassAdjustment(t);
    };

    // TODO: This part is broken when there is a limit, if this is supposed to be taken into account.
    let integralYtoX = (f, t: t) => {
      Shape.T.Integral.yToX(f, toShape(t));
    };

    let mean = (t: t) => {
      Shape.T.mean(t.shape);
    };
    let variance = (t: t) => Shape.T.variance(t.shape);
  });
