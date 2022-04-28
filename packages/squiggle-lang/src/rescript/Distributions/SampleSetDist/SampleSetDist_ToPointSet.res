module Internals = {
  module Types = {
    type samplingStats = {
      sampleCount: int,
      outputXYPoints: int,
      bandwidthXSuggested: float,
      bandwidthUnitSuggested: float,
      bandwidthXImplemented: float,
      bandwidthUnitImplemented: float,
    }

    type outputs = {
      continuousParseParams: option<samplingStats>,
      pointSetDist: option<PointSetTypes.pointSetDist>,
    }
  }

  module JS = {
    @deriving(abstract)
    type distJs = {
      xs: array<float>,
      ys: array<float>,
    }

    let jsToDist = (d: distJs): PointSetTypes.xyShape => {
      xs: xsGet(d),
      ys: ysGet(d),
    }

    @module("./KdeLibrary.js")
    external samplesToContinuousPdf: (array<float>, int, int) => distJs = "samplesToContinuousPdf"
  }

  module KDE = {
    let normalSampling = (samples, outputXYPoints, kernelWidth) =>
      samples |> JS.samplesToContinuousPdf(_, outputXYPoints, kernelWidth) |> JS.jsToDist
  }

  module T = {
    type t = array<float>

    let xWidthToUnitWidth = (samples, outputXYPoints, xWidth) => {
      let xyPointRange = E.A.Sorted.range(samples) |> E.O.default(0.0)
      let xyPointWidth = xyPointRange /. float_of_int(outputXYPoints)
      xWidth /. xyPointWidth
    }

    let formatUnitWidth = w => Jstat.max([w, 1.0]) |> int_of_float

    let suggestedUnitWidth = (samples, outputXYPoints) => {
      let suggestedXWidth = SampleSetDist_Bandwidth.nrd0(samples)
      xWidthToUnitWidth(samples, outputXYPoints, suggestedXWidth)
    }

    let kde = (~samples, ~outputXYPoints, width) =>
      KDE.normalSampling(samples, outputXYPoints, width)
  }
}

let toPointSetDist = (
  ~samples: Internals.T.t,
  ~samplingInputs: SamplingInputs.samplingInputs,
  (),
): Internals.Types.outputs => {
  Array.fast_sort(compare, samples)
  let minDiscreteToKeep = MagicNumbers.ToPointSet.minDiscreteToKeep(samples)
  let (continuousPart, discretePart) = E.A.Sorted.Floats.splitContinuousAndDiscreteForMinWeight(
    samples,
    ~minDiscreteWeight=minDiscreteToKeep,
  )
  let length = samples |> E.A.length |> float_of_int
  let discrete: PointSetTypes.discreteShape =
    discretePart
    |> E.FloatFloatMap.fmap(r => r /. length)
    |> E.FloatFloatMap.toArray
    |> XYShape.T.fromZippedArray
    |> Discrete.make

  let pdf =
    continuousPart |> E.A.length > 5
      ? {
          let _suggestedXWidth = SampleSetDist_Bandwidth.nrd0(continuousPart)
          // todo: This does some recalculating from the last step.
          let _suggestedUnitWidth = Internals.T.suggestedUnitWidth(
            continuousPart,
            samplingInputs.outputXYPoints,
          )
          let usedWidth = samplingInputs.kernelWidth |> E.O.default(_suggestedXWidth)
          let usedUnitWidth = Internals.T.xWidthToUnitWidth(
            samples,
            samplingInputs.outputXYPoints,
            usedWidth,
          )
          let samplingStats: Internals.Types.samplingStats = {
            sampleCount: samplingInputs.sampleCount,
            outputXYPoints: samplingInputs.outputXYPoints,
            bandwidthXSuggested: _suggestedXWidth,
            bandwidthUnitSuggested: _suggestedUnitWidth,
            bandwidthXImplemented: usedWidth,
            bandwidthUnitImplemented: usedUnitWidth,
          }
          continuousPart
          |> Internals.T.kde(
            ~samples=_,
            ~outputXYPoints=samplingInputs.outputXYPoints,
            Internals.T.formatUnitWidth(usedUnitWidth),
          )
          |> Continuous.make
          |> (r => Some((r, samplingStats)))
        }
      : None

  let pointSetDist = MixedShapeBuilder.buildSimple(
    ~continuous=pdf |> E.O.fmap(fst),
    ~discrete=Some(discrete),
  )

  /*
   I'm surprised that this doesn't come out normalized. My guess is that the KDE library
  we're using is standardizing on something else. If we ever change that library, we should
  check to see if we still need to do this.
 */

  let normalizedPointSet = pointSetDist->E.O2.fmap(PointSetDist.T.normalize)

  let samplesParse: Internals.Types.outputs = {
    continuousParseParams: pdf |> E.O.fmap(snd),
    pointSetDist: normalizedPointSet,
  }

  samplesParse
}
