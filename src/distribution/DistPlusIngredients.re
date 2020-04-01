open DistTypes;

let make =
    (~guesstimatorString, ~domain=Complete, ~unit=UnspecifiedDistribution, ())
    : distPlusIngredients => {
  guesstimatorString,
  domain,
  unit,
};

let applyTruncation = (truncateTo, distPlus) =>
  switch (truncateTo, distPlus) {
  | (Some(t), Some(d)) => Some(d |> Distributions.DistPlus.T.truncate(t))
  | (None, Some(d)) => Some(d)
  | _ => None
  };

let toDistPlus =
    (
      ~sampleCount=2000,
      ~outputXYPoints=1500,
      ~truncateTo=Some(300),
      ~kernelWidth=5,
      t: distPlusIngredients,
    )
    : option(distPlus) => {
  let toDist = shape =>
    Distributions.DistPlus.make(
      ~shape,
      ~domain=t.domain,
      ~unit=t.unit,
      ~guesstimatorString=Some(t.guesstimatorString),
      (),
    )
    |> Distributions.DistPlus.T.scaleToIntegralSum(~intendedSum=1.0);
  let parsed1 = MathJsParser.fromString(t.guesstimatorString);
  let shape =
    switch (parsed1) {
    | Ok(r) =>
      let shape = SymbolicDist.toShape(truncateTo |> E.O.default(10000), r);
      Some(shape |> toDist);
    | _ =>
      let fewSamples = Guesstimator.stringToSamples(t.guesstimatorString, 10);
      if (fewSamples |> E.A.length > 0) {
        let samples =
          Guesstimator.stringToSamples(t.guesstimatorString, sampleCount);
        let shape =
          Samples.T.toShape(~samples, ~outputXYPoints, ~kernelWidth, ());
        shape |> E.O.fmap(toDist) |> applyTruncation(truncateTo);
      } else {
        None;
      };
    };
    shape;
};