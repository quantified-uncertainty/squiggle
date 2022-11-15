open Jest
open Expect

/*
This encodes the expression for percent error
The test says "the percent error of received against expected is bounded by epsilon"

However, the semantics are degraded by catching some numerical instability: 
when expected is too small, the return of this function might blow up to infinity. 
So we capture that by taking the max of abs(expected) against a 1. 

A sanity check of this function would be welcome, in general it is a better way of approaching 
squiggle-lang tests than toBeSoCloseTo. 
*/
let expectErrorToBeBounded = (received, expected, ~epsilon) => {
  let distance = Js.Math.abs_float(received -. expected)
  let expectedAbs = Js.Math.abs_float(expected)
  let normalizingDenom = Js.Math.max_float(expectedAbs, 1e0)
  let error = distance /. normalizingDenom
  error->expect->toBeLessThan(epsilon)
}

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1)->toEqual(item2))
    : test(str, () => expect(item1)->toEqual(item2))

let {toFloat, toDist, toString, toError, fmap} = module(DistributionOperation.Output)

let fnImage = (theFn, inps) => Js.Array.map(theFn, inps)

let env: GenericDist.env = {
  sampleCount: MagicNumbers.Environment.defaultSampleCount,
  xyPointLength: MagicNumbers.Environment.defaultXYPointLength,
}

let run = DistributionOperation.run(~env)
let outputMap = fmap(~env)
let unreachableInTestFileMessage = "Should be impossible to reach (This error is in test file)"
let toExtFloat: option<float> => float = E.O.toExt(_, unreachableInTestFileMessage)
let toExtDist: option<DistributionTypes.genericDist> => DistributionTypes.genericDist = E.O.toExt(
  _,
  unreachableInTestFileMessage,
)
// let toExt: option<'a> => 'a = E.O.toExt(_, unreachableInTestFileMessage)
let unpackFloat = x => x->toFloat->toExtFloat
let unpackDist = y => y->toDist->toExtDist

let mkNormal = (mean, stdev) => DistributionTypes.Symbolic(#Normal({mean, stdev}))
let mkBeta = (alpha, beta) => DistributionTypes.Symbolic(#Beta({alpha, beta}))
let mkExponential = rate => DistributionTypes.Symbolic(#Exponential({rate: rate}))
let mkUniform = (low, high) => DistributionTypes.Symbolic(#Uniform({low, high}))
let mkCauchy = (local, scale) => DistributionTypes.Symbolic(#Cauchy({local, scale}))
let mkLognormal = (mu, sigma) => DistributionTypes.Symbolic(#Lognormal({mu, sigma}))
let mkDelta = x => DistributionTypes.Symbolic(#Float(x))

let normalMake = SymbolicDist.Normal.make
let betaMake = SymbolicDist.Beta.make
let exponentialMake = SymbolicDist.Exponential.make
let uniformMake = SymbolicDist.Uniform.make
let cauchyMake = SymbolicDist.Cauchy.make
let lognormalMake = SymbolicDist.Lognormal.make
let triangularMake = SymbolicDist.Triangular.make
let floatMake = SymbolicDist.Float.make

let fmapGenDist = symbdistres => E.R.fmap(symbdistres, s => DistributionTypes.Symbolic(s))
let normalMakeR = (mean, stdev) => fmapGenDist(SymbolicDist.Normal.make(mean, stdev))
let betaMakeR = (alpha, beta) => fmapGenDist(SymbolicDist.Beta.make(alpha, beta))
let exponentialMakeR = rate => fmapGenDist(SymbolicDist.Exponential.make(rate))
let uniformMakeR = (low, high) => fmapGenDist(SymbolicDist.Uniform.make(low, high))
let cauchyMakeR = (local, rate) => fmapGenDist(SymbolicDist.Cauchy.make(local, rate))
let lognormalMakeR = (mu, sigma) => fmapGenDist(SymbolicDist.Lognormal.make(mu, sigma))
let triangularMakeR = (low, mode, high) =>
  fmapGenDist(SymbolicDist.Triangular.make(low, mode, high))
