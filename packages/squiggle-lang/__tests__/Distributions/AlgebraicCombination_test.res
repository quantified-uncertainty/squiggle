open Jest
open Expect
open TestHelpers

//let env: DistributionOperation.env = {
//    sampleCount: 100, 
//    xyPointLength: 100, 
//}

let {
  normalDist5,
  normalDist10,
  normalDist20,
  normalDist,  // mean=5; stdev=2
  uniformDist,  // low=9; high=10
  betaDist,  // alpha=2; beta=5
  lognormalDist,  // mu=0; sigma=1
  cauchyDist,  // local=1; scale=1
  triangularDist,  // low=1; medium=2; high=3;
  exponentialDist,  // rate=2
} = module(GenericDist_Fixtures)

// let {toFloat, toDist, toString, toError, fmap} = module(DistributionOperation.Output)
// let {run} = module(DistributionOperation)
let {
    algebraicAdd, 
    algebraicMultiply, 
    algebraicDivide, 
    algebraicSubtract, 
    algebraicLogarithm, 
    algebraicPower
} = module(DistributionOperation.Constructors)
// let toExt: option<'a> => 'a = E.O.toExt(
//   "Should be impossible to reach (This error is in test file)",
// )
let algebraicAdd = algebraicAdd(~env)
let algebraicMultiply = algebraicMultiply(~env)
let algebraicDivide = algebraicDivide(~env)
let algebraicSubtract = algebraicSubtract(~env)
let algebraicLogarithm = algebraicLogarithm(~env)
let algebraicPower = algebraicPower(~env)
describe("Addition of distributions", () => {

    describe("mean", () => {
        test("normal(mean=5) + normal(mean=20)", () => {
            normalDist5
            -> algebraicAdd(normalDist20)
            -> E.R2.fmap(GenericDist_Types.Constructors.UsingDists.mean)
            -> E.R2.fmap(run)
            -> E.R2.fmap(toFloat)
            -> E.R.toExn
            -> expect
            -> toBe(Some(2.5e1))
            // -> toBeSoCloseTo(2.5e1, ~digits=7)
        })
    })
//   testAll("(normal(mean=5) + normal(mean=5)).pdf", list{1e0, 3e0, 5e0, 7e0}, x => {
//       let additionValue = algebraicAdd(normalDist5, normalDist5)
//       let targetValue = run(FromDist(ToFloat(#Pdf(x)), normalDist10)) -> unpackFloat
//       E.R.fmap(run(FromDist(ToFloat(#Pdf(x)), additionValue)))
//       -> unpackFloat
//       -> expect 
//       -> toBeSoCloseTo(2.5e1, ~digits=7)
//   })
})