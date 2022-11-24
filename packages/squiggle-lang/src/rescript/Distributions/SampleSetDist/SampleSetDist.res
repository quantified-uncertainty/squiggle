@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const SampleSetDist = require('../../../Dist/SampleSetDist/SampleSetDist')`)

type t

module Error = {
  type sampleSetError

  type pointsetConversionError

  let pointsetConversionErrorToString = (err: pointsetConversionError) =>
    %raw(`SampleSEtDist.Error.pointsetConversionErrorToString(err)`)

  //   let fromOperationError = e => OperationError(e)

  let toString = (err: sampleSetError) => {
    %raw(`SampleSetDist.Error.toString(err)`)
  }
}

include Error

// let length = (t: t) => get(t)->E.A.length

let toPointSetDist = (~samples: t, ~samplingInputs: SamplingInputs.samplingInputs): result<
  PointSetTypes.pointSetDist,
  pointsetConversionError,
> => {
  %raw(`SampleSetDist.toPointSetDist({ samples, samplingInputs })`)
}

let make = (a: array<float>): result<t, Error.sampleSetError> => %raw(`SampleSetDist.make(a)`)

let sample = (t: t): float => %raw(`SampleSetDist.sample(t)`)

let sampleN = (t: t, n: int): array<float> => %raw(`SampleSetDist.sampleN(t, n)`)

let getSamples = (t: t): array<float> => %raw(`t`)

let samplesMap = (~fn: float => result<float, Operation.Error.t>, t: t): result<
  t,
  sampleSetError,
> => %raw(`SampleSetDist.samplesMap(t, fn)`)

let map2 = (~fn: (float, float) => result<float, Operation.Error.t>, ~t1: t, ~t2: t): result<
  t,
  sampleSetError,
> => %raw(`SampleSetDist.map2({ fn, t1, t2 })`)

let map3 = (
  ~fn: (float, float, float) => result<float, Operation.Error.t>,
  ~t1: t,
  ~t2: t,
  ~t3: t,
): result<t, sampleSetError> => %raw(`SampleSetDist.map3({ fn, t1, t2, t3 })`)

let mapN = (~fn: array<float> => result<float, Operation.Error.t>, ~t1: array<t>): result<
  t,
  sampleSetError,
> => %raw(`SampleSetDist.mapN({ fn, t1 })`)

let mean = (t: t): float => %raw(`SampleSetDist.mean(t)`)
let min = (t: t): float => %raw(`SampleSetDist.min(t)`)
let max = (t: t): float => %raw(`SampleSetDist.max(t)`)
// let geomean = t => T.get(t)->E.A.Floats.geomean
let mode = (t: t): float => %raw(`SampleSetDist.mode(t)`)
// let mode = t => T.get(t)->E.A.Floats.mode
// let sum = t => T.get(t)->E.A.Floats.sum
let stdev = (t: t): float => %raw(`SampleSetDist.stdev(t)`)
let variance = (t: t): float => %raw(`SampleSetDist.variance(t)`)
let percentile = (t: t, f: float): float => %raw(`SampleSetDist.percentile(t, f)`)
let cdf = (t: t, f: float): float => %raw(`SampleSetDist.cdf(t, f)`)

let mixture = (values: array<(t, float)>, intendedLength: int): result<t, sampleSetError> => {
  %raw(`SampleSetDist.mixture(values, intendedLength)`)
}

let truncate = (t, ~leftCutoff: option<float>, ~rightCutoff: option<float>) => {
  %raw(`SampleSetDist.truncate(t, leftCutoff, rightCutoff)`)
}

let minOfTwo = (t1: t, t2: t): result<t, sampleSetError> => %raw(`SampleSetDist.minOfTwo(t1, t2)`)
let maxOfTwo = (t1: t, t2: t): result<t, sampleSetError> => %raw(`SampleSetDist.maxOfTwo(t1, t2)`)

let minOfFloat = (t: t, f: float): result<t, sampleSetError> =>
  %raw(`SampleSetDist.minOfFloat(t, f)`)
let maxOfFloat = (t: t, f: float): result<t, sampleSetError> =>
  %raw(`SampleSetDist.maxOfFloat(t, f)`)
