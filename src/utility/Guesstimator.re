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
};

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

module FloatFloatMap = {
  module Id =
    Belt.Id.MakeComparable({
      type t = float;
      let cmp: (float, float) => int = Pervasives.compare;
    });

  type t = Belt.MutableMap.t(Id.t, float, Id.identity);

  let fromArray = (ar: array((float, float))) =>
    Belt.MutableMap.fromArray(ar, ~id=(module Id));
  let toArray = (t: t) => Belt.MutableMap.toArray(t);
  let empty = () => Belt.MutableMap.make(~id=(module Id));
  let increment = (el, t: t) =>
    Belt.MutableMap.update(
      t,
      el,
      fun
      | Some(n) => Some(n +. 1.0)
      | None => Some(1.0),
    );

  let get = (el, t: t) => Belt.MutableMap.get(t, el);
  let fmap = (fn, t: t) => Belt.MutableMap.map(t, fn);
};

// todo: Figure out some way of doing this without creating a new array.
let split = (sortedArray: array(float)) => {
  let continuous = [||];
  let discrete = FloatFloatMap.empty();
  Belt.Array.forEachWithIndex(
    sortedArray,
    (index, element) => {
      let maxIndex = (sortedArray |> Array.length) - 1;
      let possiblySimilarElements =
        (
          switch (index) {
          | 0 => [|index + 1|]
          | n when n == maxIndex => [|index - 1|]
          | _ => [|index - 1, index + 1|]
          }
        )
        |> Belt.Array.map(_, r => sortedArray[r]);
      let hasSimilarElement =
        Belt.Array.some(possiblySimilarElements, r => r == element);
      hasSimilarElement
        ? FloatFloatMap.increment(element, discrete)
        : {
          let _ = Js.Array.push(element, continuous);
          ();
        };
      ();
    },
  );

  (continuous, discrete);
};

let toMixed =
    (
      ~string,
      ~sampleCount=3000,
      ~outputXYPoints=3000,
      ~kernelWidth=10,
      ~cuttoff=0.995,
      (),
    ) => {
  let start = Js.Date.now();
  let timeMessage = message => Js.log2(message, Js.Date.now() -. start);
  timeMessage("Starting");
  let samples = Internals.stringToSamples(string, sampleCount);
  timeMessage("Finished sampling");

  let length = samples |> E.A.length;
  Array.fast_sort(compare, samples);
  let (continuousPart, disc) = split(samples);
  let lengthFloat = float_of_int(length);
  let discrete: DistTypes.xyShape =
    disc
    |> FloatFloatMap.fmap(r => r /. lengthFloat)
    |> FloatFloatMap.toArray
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
  shape;
};