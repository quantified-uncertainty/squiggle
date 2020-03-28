module JS = {
  [@bs.deriving abstract]
  type distJs = {
    xs: array(float),
    ys: array(float),
  };

  let jsToDist = (d: distJs): DistTypes.xyShape => {
    xs: xsGet(d),
    ys: ysGet(d),
  };

  [@bs.module "./utility/KdeLibrary.js"]
  external samplesToContinuousPdf: (array(float), int, int) => distJs =
    "samplesToContinuousPdf";
};

module KDE = {
  let normalSampling = (samples, outputXYPoints, kernelWidth) => {
    samples
    |> JS.samplesToContinuousPdf(_, outputXYPoints, kernelWidth)
    |> JS.jsToDist;
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
      |> JS.samplesToContinuousPdf(_, part1XYPoints, kernelWidth)
      |> JS.jsToDist;
    let part2 =
      part2Data
      |> JS.samplesToContinuousPdf(_, part2XYPoints, 3)
      |> JS.jsToDist;
    let opp = 1.0 -. cuttoff;
    part1;
  };
};

module T = {
  type t = array(float);

  let splitContinuousAndDiscrete = (sortedArray: t) => {
    let continuous = [||];
    let discrete = E.FloatFloatMap.empty();
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
          ? E.FloatFloatMap.increment(element, discrete)
          : {
            let _ = Js.Array.push(element, continuous);
            ();
          };
        ();
      },
    );
    (continuous, discrete);
  };

  // todo: Figure out some way of doing this without having to integrate so many times.
  let toShape = (~samples: t, ~outputXYPoints=3000, ~kernelWidth=10, ()) => {
    Array.fast_sort(compare, samples);
    let (continuousPart, discretePart) = E.A.Sorted.Floats.split(samples);
    let length = samples |> E.A.length;
    let lengthFloat = float_of_int(length);
    let discrete: DistTypes.xyShape =
      discretePart
      |> E.FloatFloatMap.fmap(r => r /. lengthFloat)
      |> E.FloatFloatMap.toArray
      |> XYShape.T.fromZippedArray;
    let pdf: DistTypes.xyShape =
      continuousPart |> E.A.length > 20
        ? {
          samples |> KDE.normalSampling(_, outputXYPoints, kernelWidth);
        }
        : {xs: [||], ys: [||]};
    let continuous = pdf |> Distributions.Continuous.make(`Linear);
    let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
    shape;
  };
};