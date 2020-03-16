module Internals = {
  [@bs.deriving abstract]
  type discrete = {
    xs: array(float),
    ys: array(float),
  };

  let jsToDistDiscrete = (d: discrete): DistTypes.discreteShape => {
    xs: xsGet(d),
    ys: ysGet(d),
  };

  [@bs.deriving abstract]
  type combined = {
    continuous: CdfLibrary.JS.distJs,
    discrete,
  };

  // todo: Force to be fewer samples
  let toContinous = (r: combined) =>
    continuousGet(r)
    |> CdfLibrary.JS.jsToDist
    |> Distributions.Continuous.fromShape;

  let toDiscrete = (r: combined): DistTypes.xyShape =>
    discreteGet(r) |> jsToDistDiscrete;

  [@bs.module "./GuesstimatorLibrary.js"]
  external toCombinedFormat: (string, int, int, int) => combined = "run";

  [@bs.module "./GuesstimatorLibrary.js"]
  external stringToSamples: (string, int) => array(float) = "stringToSamples";

  [@bs.module "./GuesstimatorLibrary.js"]
  external samplesToContinuousPdf:
    (array(float), int, int) => CdfLibrary.JS.distJs =
    "samplesToContinuousPdf";

  // todo: Format to correct mass, also normalize the pdf.
  let toMixedShape =
      (~truncateTo=Some(500), r: combined): option(DistTypes.shape) => {
    let continuous = toContinous(r);
    let continuous =
      switch (truncateTo) {
      | Some(t) =>
        continuous |> Distributions.Continuous.convertToNewLength(t)
      | None => continuous
      };
    let discrete = toDiscrete(r);
    // let continuousProb =
    //   cont |> Distributions.Continuous.T.Integral.sum(~cache=None);
    // let discreteProb =
    //   d |> Distributions.Discrete.T.Integral.sum(~cache=None);

    let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
    shape;
  };
};

let stringToMixedShape =
    (
      ~string,
      ~sampleCount=3000,
      ~outputXYPoints=3000,
      ~width=10,
      ~truncateTo=Some(500),
      (),
    ) =>
  Internals.toCombinedFormat(string, sampleCount, outputXYPoints, width)
  |> Internals.toMixedShape(~truncateTo);

module KDE = {
  let normalSampling = (samples, outputXYPoints, kernelWidth) => {
    samples
    |> Internals.samplesToContinuousPdf(_, outputXYPoints, kernelWidth)
    |> CdfLibrary.JS.jsToDist;
  };

  let inGroups = (samples, outputXYPoints, kernelWidth, ~cuttoff=0.9, ()) => {
    let partitionAt =
      samples
      |> E.A.length
      |> float_of_int
      |> (e => e *. cuttoff)
      |> int_of_float;
    let part1XYPoints =
      outputXYPoints |> float_of_int |> (e => e *. cuttoff) |> int_of_float;
    let part2XYPoints = outputXYPoints - part1XYPoints |> Js.Math.max_int(30);
    let part1Data =
      samples |> Belt.Array.slice(_, ~offset=0, ~len=partitionAt);
    let part2DataLength = (samples |> E.A.length) - partitionAt;
    let part2Data =
      samples
      |> Belt.Array.slice(
           _,
           ~offset=(-1) * part2DataLength,
           ~len=part2DataLength,
         );
    let part1 =
      part1Data
      |> Internals.samplesToContinuousPdf(_, part1XYPoints, kernelWidth)
      |> CdfLibrary.JS.jsToDist;
    let part2 =
      part2Data
      |> Internals.samplesToContinuousPdf(_, part2XYPoints, 3)
      |> CdfLibrary.JS.jsToDist;
    let opp = 1.0 -. cuttoff;
    // let result =
    //   XYShape.T.Combine.combineLinear(
    //     part1,
    //     part2,
    //     (a, b) => {
    //       let aa = a *. cuttoff;
    //       let bb = b *. opp;
    //       aa +. bb;
    //     },
    //   );
    // Js.log2("HI", result);
    // result;
    part1;
  };
};

let toMixed =
    (
      ~string,
      ~sampleCount=3000,
      ~outputXYPoints=3000,
      ~kernelWidth=10,
      ~truncateTo=Some(500),
      ~cuttoff=0.995,
      (),
    ) => {
  let truncateTo = None;
  let start = Js.Date.now();
  let timeMessage = message => Js.log2(message, Js.Date.now() -. start);
  timeMessage("Starting");
  let samples = Internals.stringToSamples(string, sampleCount);
  timeMessage("Finished sampling");

  let length = samples |> E.A.length;
  Array.fast_sort(compare, samples);
  // let items =
  //   E.A.uniq(samples)
  //   |> E.A.fmap(r => (r, samples |> E.A.filter(n => n == r) |> E.A.length));
  // let (discretePart, continuousPart) =
  //   Belt.Array.partition(items, ((_, count)) => count > 1);
  let discretePart = [||];
  let continuousPart = samples;
  let discrete: DistTypes.xyShape =
    discretePart
    |> E.A.fmap(((x, count)) =>
         (x, float_of_int(count) /. float_of_int(length))
       )
    |> XYShape.T.fromZippedArray;
  let pdf: DistTypes.xyShape =
    continuousPart |> E.A.length > 20
      ? {
        // samples |> KDE.inGroups(_, outputXYPoints, kernelWidth, ~cuttoff, ());
        samples |> KDE.normalSampling(_, outputXYPoints, kernelWidth);
      }
      : {xs: [||], ys: [||]};
  timeMessage("Finished pdf");
  let continuous = pdf |> Distributions.Continuous.fromShape;
  let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
  timeMessage("Finished shape");
  let shape =
    switch (truncateTo, shape) {
    | (Some(trunctate), Some(shape)) =>
      Some(shape |> Distributions.Shape.T.truncate(trunctate))
    | (None, Some(shape)) => Some(shape)
    | _ => None
    };
  timeMessage("Finished truncation");
  shape;
};