@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const SampleSetDist = require('../../../Dist/SampleSetDist/SampleSetDist')`)

type t = DistributionTypes.genericDist

type distError = DistError.t

type r = result<t, distError>

let make = (a: array<float>): r => %raw(`SampleSetDist.SampleSetDist.make(a)`)

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

let minOfTwo = (t1: t, t2: t): r => %raw(`SampleSetDist.minOfTwo(t1, t2)`)
let maxOfTwo = (t1: t, t2: t): r => %raw(`SampleSetDist.maxOfTwo(t1, t2)`)

let minOfFloat = (t: t, f: float): r => %raw(`SampleSetDist.minOfFloat(t, f)`)
let maxOfFloat = (t: t, f: float): r => %raw(`SampleSetDist.maxOfFloat(t, f)`)
