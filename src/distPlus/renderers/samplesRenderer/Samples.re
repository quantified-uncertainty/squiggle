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

  [@bs.module "./KdeLibrary.js"]
  external samplesToContinuousPdf: (array(float), int, int) => distJs =
    "samplesToContinuousPdf";
};

module KDE = {
  let normalSampling = (samples, outputXYPoints, kernelWidth) => {
    samples
    |> JS.samplesToContinuousPdf(_, outputXYPoints, kernelWidth)
    |> JS.jsToDist;
  };

  // Note: This was an experiment, but it didn't actually work that well.
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

  let xWidthToUnitWidth = (samples, outputXYPoints, xWidth) => {
    let xyPointRange = E.A.Sorted.range(samples) |> E.O.default(0.0);
    let xyPointWidth = xyPointRange /. float_of_int(outputXYPoints);
    xWidth /. xyPointWidth;
  };

  let formatUnitWidth = w => Jstat.max([|w, 1.0|]) |> int_of_float;

  let suggestedUnitWidth = (samples, outputXYPoints) => {
    let suggestedXWidth = Bandwidth.nrd0(samples);
    xWidthToUnitWidth(samples, outputXYPoints, suggestedXWidth);
  };

  let kde = (~samples, ~outputXYPoints, width) => {
    KDE.normalSampling(samples, outputXYPoints, width);
  };

  let toShape =
      (~samples: t, ~samplingInputs: RenderTypes.ShapeRenderer.Sampling.Inputs.fInputs, ()) => {
    Array.fast_sort(compare, samples);
    let (continuousPart, discretePart) = E.A.Sorted.Floats.split(samples);
    let length = samples |> E.A.length |> float_of_int;
    let discrete: DistTypes.xyShape =
      discretePart
      |> E.FloatFloatMap.fmap(r => r /. length)
      |> E.FloatFloatMap.toArray
      |> XYShape.T.fromZippedArray;

    let pdf =
      continuousPart |> E.A.length > 5
        ? {
          let _suggestedXWidth = Bandwidth.nrd0(continuousPart);
          let _suggestedUnitWidth =
            suggestedUnitWidth(continuousPart, samplingInputs.outputXYPoints);
          let usedWidth =
            samplingInputs.kernelWidth |> E.O.default(_suggestedXWidth);
          let usedUnitWidth =
            xWidthToUnitWidth(
              samples,
              samplingInputs.outputXYPoints,
              usedWidth,
            );
          let foo: RenderTypes.ShapeRenderer.Sampling.samplingStats = {
            sampleCount: samplingInputs.sampleCount,
            outputXYPoints: samplingInputs.outputXYPoints,
            bandwidthXSuggested: _suggestedXWidth,
            bandwidthUnitSuggested: _suggestedUnitWidth,
            bandwidthXImplemented: usedWidth,
            bandwidthUnitImplemented: usedUnitWidth,
          };
          continuousPart
          |> kde(
               ~samples=_,
               ~outputXYPoints=samplingInputs.outputXYPoints,
               formatUnitWidth(usedUnitWidth),
             )
          |> Distributions.Continuous.make(`Linear)
          |> (r => Some((r, foo)));
        }
        : None;
    let shape =
      MixedShapeBuilder.buildSimple(
        ~continuous=pdf |> E.O.fmap(fst),
        ~discrete,
      );
    let samplesParse: RenderTypes.ShapeRenderer.Sampling.outputs = {
      continuousParseParams: pdf |> E.O.fmap(snd),
      shape,
    };
    samplesParse;
  };

  let fromGuesstimatorString =
      (
        ~guesstimatorString,
        ~samplingInputs=RenderTypes.ShapeRenderer.Sampling.Inputs.empty,
        (),
      ) => {
    let hasValidSamples =
      Guesstimator.stringToSamples(guesstimatorString, 10) |> E.A.length > 0;
    let samplingInputs = RenderTypes.ShapeRenderer.Sampling.Inputs.toF(samplingInputs);
    switch (hasValidSamples) {
    | false => None
    | true =>
      let samples =
        Guesstimator.stringToSamples(guesstimatorString, samplingInputs.sampleCount);
      Some(toShape(~samples, ~samplingInputs, ()));
    };
  };
};