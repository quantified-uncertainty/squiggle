module Types = {
  type samplingStats = {
    sampleCount: int,
    outputXYPoints: int,
    bandwidthXSuggested: float,
    bandwidthUnitSuggested: float,
    bandwidthXImplemented: float,
    bandwidthUnitImplemented: float,
  };

  type outputs = {
    continuousParseParams: option(samplingStats),
    shape: option(DistTypes.shape),
  };
};

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

  let toShape = (~samples: t, ~samplingInputs: ExpressionTypes.ExpressionTree.samplingInputs, ()) => {
    Array.fast_sort(compare, samples);
    let (continuousPart, discretePart) = E.A.Sorted.Floats.split(samples);
    let length = samples |> E.A.length |> float_of_int;
    let discrete: DistTypes.discreteShape =
      discretePart
      |> E.FloatFloatMap.fmap(r => r /. length)
      |> E.FloatFloatMap.toArray
      |> XYShape.T.fromZippedArray
      |> Discrete.make;

    let pdf =
      continuousPart |> E.A.length > 5
        ? {
          let _suggestedXWidth = Bandwidth.nrd0(continuousPart);
          // todo: This does some recalculating from the last step.
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
          let samplingStats: Types.samplingStats = {
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
          |> Continuous.make
          |> (r => Some((r, samplingStats)));
        }
        : None;

    let shape =
      MixedShapeBuilder.buildSimple(
        ~continuous=pdf |> E.O.fmap(fst),
        ~discrete=Some(discrete),
      );

    let samplesParse: Types.outputs = {
      continuousParseParams: pdf |> E.O.fmap(snd),
      shape,
    };

    samplesParse;
  };

  let fromSamples = (~samplingInputs, samples) => {
    toShape(~samples, ~samplingInputs, ());
  };
};
