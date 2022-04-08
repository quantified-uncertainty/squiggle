@genType
type t = array<float>

// TODO: Refactor to raise correct error when not enough samples

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

    let splitContinuousAndDiscrete = (sortedArray: t) => {
      let continuous = []
      let discrete = E.FloatFloatMap.empty()
      Belt.Array.forEachWithIndex(sortedArray, (index, element) => {
        let maxIndex = (sortedArray |> Array.length) - 1
        let possiblySimilarElements = switch index {
        | 0 => [index + 1]
        | n if n == maxIndex => [index - 1]
        | _ => [index - 1, index + 1]
        } |> Belt.Array.map(_, r => sortedArray[r])
        let hasSimilarElement = Belt.Array.some(possiblySimilarElements, r => r == element)
        hasSimilarElement
          ? E.FloatFloatMap.increment(element, discrete)
          : {
              let _ = Js.Array.push(element, continuous)
            }
        ()
      })
      (continuous, discrete)
    }

    let xWidthToUnitWidth = (samples, outputXYPoints, xWidth) => {
      let xyPointRange = E.A.Sorted.range(samples) |> E.O.default(0.0)
      let xyPointWidth = xyPointRange /. float_of_int(outputXYPoints)
      xWidth /. xyPointWidth
    }

    let formatUnitWidth = w => Jstat.max([w, 1.0]) |> int_of_float

    let suggestedUnitWidth = (samples, outputXYPoints) => {
      let suggestedXWidth = Bandwidth.nrd0(samples)
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
) => {
  Array.fast_sort(compare, samples)
  let (continuousPart, discretePart) = E.A.Sorted.Floats.split(samples)
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
          let _suggestedXWidth = Bandwidth.nrd0(continuousPart)
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

  let samplesParse: Internals.Types.outputs = {
    continuousParseParams: pdf |> E.O.fmap(snd),
    pointSetDist: pointSetDist,
  }

  samplesParse
}