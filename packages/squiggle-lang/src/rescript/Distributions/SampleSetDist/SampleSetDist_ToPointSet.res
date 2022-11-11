module Internals = {
  module Types = {
    type samplingStats = {
      sampleCount: int,
      outputXYPoints: int,
      bandwidthXSuggested: float,
      bandwidthXImplemented: float,
    }

    type outputs = {
      continuousParseParams: option<samplingStats>,
      pointSetDist: option<PointSetTypes.pointSetDist>,
    }
  }

  module JS = {
    @deriving(abstract)
    type distJs = {
      usedWidth: float,
      xs: array<float>,
      ys: array<float>,
    }

    let jsToDist = (d: distJs): (float, PointSetTypes.xyShape) => {
      (
        usedWidthGet(d),
        {
          xs: xsGet(d),
          ys: ysGet(d),
        },
      )
    }

    @module("./KdeLibrary.js")
    external samplesToContinuousPdf: (array<float>, int, float, float) => distJs =
      "samplesToContinuousPdf"
  }

  module KDE = {
    let normalSampling = (samples, outputXYPoints, kernelWidth, totalWeight) =>
      samples->JS.samplesToContinuousPdf(outputXYPoints, kernelWidth, totalWeight)->JS.jsToDist
  }
}

let toPointSetDist = (
  ~samples: array<float>,
  ~samplingInputs: SamplingInputs.samplingInputs,
  (),
): Internals.Types.outputs => {
  let samples = samples->E.A.Floats.sort

  let minDiscreteToKeep = MagicNumbers.ToPointSet.minDiscreteToKeep(samples)
  let (continuousPart, discretePart) = E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(
    samples,
    ~minDiscreteWeight=minDiscreteToKeep,
  )

  let contLength = continuousPart->E.A.length
  let length = samples->E.A.length
  let outLength = contLength <= 5 ? length - contLength : length
  let pointWeight = 1. /. outLength->float_of_int

  let pdf = if contLength <= 5 {
    // Drop these points; missing mass accounted for by outLength above
    None
  } else if E.A.unsafe_get(continuousPart, 0) == E.A.unsafe_get(continuousPart, contLength - 1) {
    // All the same value: treat as discrete
    Js.Array2.push(discretePart, (E.A.unsafe_get(continuousPart, 0), contLength))->ignore
    None
  } else {
    // The only reason we compute _suggestedXWidth if
    // samplingInputs.kernelWidth is given is to log it. Unnecessary?
    let _suggestedXWidth = SampleSetDist_Bandwidth.nrd0(continuousPart)
    let width = samplingInputs.kernelWidth->E.O.default(_suggestedXWidth)
    let (usedWidth, pdf) =
      continuousPart->Internals.KDE.normalSampling(
        samplingInputs.outputXYPoints,
        width,
        pointWeight,
      )
    let samplingStats: Internals.Types.samplingStats = {
      sampleCount: samplingInputs.sampleCount,
      outputXYPoints: samplingInputs.outputXYPoints,
      bandwidthXSuggested: _suggestedXWidth,
      bandwidthXImplemented: usedWidth,
    }

    Some((pdf->Continuous.make, samplingStats))
  }

  let discrete: PointSetTypes.discreteShape =
    discretePart
    ->E.A.fmap(((x, count)) => (x, count->Belt.Int.toFloat *. pointWeight))
    ->XYShape.T.fromZippedArray
    ->Discrete.make

  let pointSetDist = MixedShapeBuilder.buildSimple(
    ~continuous=pdf->E.O.fmap(fst),
    ~discrete=Some(discrete),
  )

  let samplesParse: Internals.Types.outputs = {
    continuousParseParams: pdf->E.O.fmap(snd),
    pointSetDist,
  }

  samplesParse
}
