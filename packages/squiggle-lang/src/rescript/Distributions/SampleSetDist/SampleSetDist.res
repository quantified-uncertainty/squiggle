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

type r = result<t, Error.sampleSetError>

// include Error

// let length = (t: t) => get(t)->E.A.length

let toPointSetDist = (~samples: t, ~env: Env.env): result<
  PointSetTypes.pointSetDist,
  Error.pointsetConversionError,
> => {
  %raw(`samples.toPointSetDist(env)`)
}

let make = (a: array<float>): r => %raw(`SampleSetDist.SampleSetDist.make(a)`)

let sample = (t: t): float => %raw(`t.sample()`)
let sampleN = (t: t, n: int): array<float> => %raw(`t.sampleN(n)`)

let getSamples = (t: t): array<float> => %raw(`t.samples`)

let samplesMap = (~fn: float => result<float, Operation.Error.t>, t: t): r =>
  %raw(`t.samplesMap(fn)`)

let map2 = (~fn: (float, float) => result<float, Operation.Error.t>, ~t1: t, ~t2: t): r =>
  %raw(`SampleSetDist.map2({ fn, t1, t2 })`)

let map3 = (
  ~fn: (float, float, float) => result<float, Operation.Error.t>,
  ~t1: t,
  ~t2: t,
  ~t3: t,
): r => %raw(`SampleSetDist.map3({ fn, t1, t2, t3 })`)

let mapN = (~fn: array<float> => result<float, Operation.Error.t>, ~t1: array<t>): r =>
  %raw(`SampleSetDist.mapN({ fn, t1 })`)

let mean = (t: t): float => %raw(`t.mean()`)
let min = (t: t): float => %raw(`t.min()`)
let max = (t: t): float => %raw(`t.max()`)
let mode = (t: t): float => %raw(`t.mode()`)
// let geomean = t => T.get(t)->E.A.Floats.geomean
// let sum = t => T.get(t)->E.A.Floats.sum
let stdev = (t: t): float => %raw(`t.stdev()`)
let variance = (t: t): float => %raw(`t.variance()`)
let percentile = (t: t, f: float): float => %raw(`t.inv(f)`)
let cdf = (t: t, f: float): float => %raw(`t.cdf(f)`)

let mixture = (values: array<(t, float)>, intendedLength: int): r => {
  %raw(`SampleSetDist.mixture(values, intendedLength)`)
}

let truncate = (t, ~leftCutoff: option<float>, ~rightCutoff: option<float>): r => {
  %raw(`t.truncate(leftCutoff, rightCutoff)`)
}

let minOfTwo = (t1: t, t2: t): r => %raw(`SampleSetDist.minOfTwo(t1, t2)`)
let maxOfTwo = (t1: t, t2: t): r => %raw(`SampleSetDist.maxOfTwo(t1, t2)`)

let minOfFloat = (t: t, f: float): r => %raw(`SampleSetDist.minOfFloat(t, f)`)
let maxOfFloat = (t: t, f: float): r => %raw(`SampleSetDist.maxOfFloat(t, f)`)
