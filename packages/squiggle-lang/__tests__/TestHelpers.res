open Jest
open Expect

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1)->toEqual(item2))
    : test(str, () => expect(item1)->toEqual(item2))

let {toFloat, toDist, toString, toError, fmap} = module(DistributionOperation.Output)

let fnImage = (theFn, inps) => Js.Array.map(theFn, inps)

let env: DistributionOperation.env = {
  sampleCount: 10000,
  xyPointLength: 1000,
}

let run = DistributionOperation.run(~env)
let outputMap = fmap(~env)
let unreachableInTestFileMessage = "Should be impossible to reach (This error is in test file)"
let toExtFloat: option<float> => float = E.O.toExt(unreachableInTestFileMessage)
let toExtDist: option<DistributionTypes.genericDist> => DistributionTypes.genericDist = E.O.toExt(
  unreachableInTestFileMessage,
)
// let toExt: option<'a> => 'a = E.O.toExt(unreachableInTestFileMessage)
let unpackFloat = x => x->toFloat->toExtFloat
let unpackDist = y => y->toDist->toExtDist

let mkNormal = (mean, stdev) => DistributionTypes.Symbolic(#Normal({mean: mean, stdev: stdev}))
let mkBeta = (alpha, beta) => DistributionTypes.Symbolic(#Beta({alpha: alpha, beta: beta}))
let mkExponential = rate => DistributionTypes.Symbolic(#Exponential({rate: rate}))
let mkUniform = (low, high) => DistributionTypes.Symbolic(#Uniform({low: low, high: high}))
let mkCauchy = (local, scale) => DistributionTypes.Symbolic(#Cauchy({local: local, scale: scale}))
let mkLognormal = (mu, sigma) => DistributionTypes.Symbolic(#Lognormal({mu: mu, sigma: sigma}))

let normalMake = SymbolicDist.Normal.make
let betaMake = SymbolicDist.Beta.make
let exponentialMake = SymbolicDist.Exponential.make
let uniformMake = SymbolicDist.Uniform.make
let cauchyMake = SymbolicDist.Cauchy.make
let lognormalMake = SymbolicDist.Lognormal.make
let triangularMake = SymbolicDist.Triangular.make
let floatMake = SymbolicDist.Float.make
