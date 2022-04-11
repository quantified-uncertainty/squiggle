open Jest
open Expect
open TestHelpers

let {
  normalDist5,  // mean=5, stdev=2
  normalDist10,  // mean=10, stdev=2
  normalDist20,  // mean=20, stdev=2
  normalDist,  // mean=5; stdev=2
  uniformDist,  // low=9; high=10
  betaDist,  // alpha=2; beta=5
  lognormalDist,  // mu=0; sigma=1
  cauchyDist,  // local=1; scale=1
  triangularDist,  // low=1; medium=2; high=3;
  exponentialDist,  // rate=2
} = module(GenericDist_Fixtures)

let {
    algebraicAdd, 
    algebraicMultiply, 
    algebraicDivide, 
    algebraicSubtract, 
    algebraicLogarithm, 
    algebraicPower
} = module(DistributionOperation.Constructors)

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
        })
    })
    describe("pdf", () => {
        testAll("(normal(mean=5) + normal(mean=5)).pdf (imprecise)", list{8e0, 1e1, 1.2e1, 1.4e1}, x => {
            let expected = normalDist10
                -> Ok 
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.pdf(d, x))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            let calculated = normalDist5
                -> algebraicAdd(normalDist5)
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.pdf(d, x))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            
            switch expected {  // not exactly happy with this
                | None => false -> expect -> toBe(true)
                | Some(x) => switch calculated {
                    | None => false -> expect -> toBe(true)
                    | Some(y) => x -> expect -> toBeSoCloseTo(y, ~digits=0)
                }
            }
        })
        test("(normal(mean=10) + normal(mean=10)).pdf(1.9e1)", () => {
            let expected = normalDist20
                -> Ok
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.pdf(d, 1.9e1))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            let calculated = normalDist10
                -> algebraicAdd(normalDist10)
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.pdf(d, 1.9e1))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            switch expected {  // not exactly happy with this
                | None => false -> expect -> toBe(true)
                | Some(x) => switch calculated {
                    | None => false -> expect -> toBe(true)
                    | Some(y) => x -> expect -> toBeSoCloseTo(y, ~digits=1)
                }
            }
        })
    })
    describe("cdf", () => {
        testAll("(normal(mean=5) + normal(mean=5)).cdf (imprecise)", list{6e0, 8e0, 1e1, 1.2e1}, x => {
            let expected = normalDist10
                -> Ok 
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.cdf(d, x))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            let calculated = normalDist5
                -> algebraicAdd(normalDist5)
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.cdf(d, x))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            
            switch expected {  // not exactly happy with this
                | None => false -> expect -> toBe(true)
                | Some(x) => switch calculated {
                    | None => false -> expect -> toBe(true)
                    | Some(y) => x -> expect -> toBeSoCloseTo(y, ~digits=0)
                }
            }
        })
        test("(normal(mean=10) + normal(mean=10)).cdf(1.25e1)", () => {
            let expected = normalDist20
                -> Ok
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.cdf(d, 1.25e1))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            let calculated = normalDist10
                -> algebraicAdd(normalDist10)
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.cdf(d, 1.25e1))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            switch expected {  // not exactly happy with this
                | None => false -> expect -> toBe(true)
                | Some(x) => switch calculated {
                    | None => false -> expect -> toBe(true)
                    | Some(y) => x -> expect -> toBeSoCloseTo(y, ~digits=2)
                }
            }
        })

    })
    describe("inv", () => {
        testAll("(normal(mean=5) + normal(mean=5)).inv (imprecise)", list{5e-2, 4.2e-3, 9e-3}, x => {
            let expected = normalDist10
                -> Ok 
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.inv(d, x))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            let calculated = normalDist5
                -> algebraicAdd(normalDist5)
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.inv(d, x))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            
            switch expected {  // not exactly happy with this. 
                | None => false -> expect -> toBe(true)
                | Some(x) => switch calculated {
                    | None => false -> expect -> toBe(true)
                    | Some(y) => x -> expect -> toBeSoCloseTo(y, ~digits=-1)
                }
            }
        })
        test("(normal(mean=10) + normal(mean=10)).inv(1e-1)", () => {
            let expected = normalDist20
                -> Ok
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.inv(d, 1e-1))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            let calculated = normalDist10
                -> algebraicAdd(normalDist10)
                -> E.R2.fmap(d => GenericDist_Types.Constructors.UsingDists.inv(d, 1e-1))
                -> E.R2.fmap(run)
                -> E.R2.fmap(toFloat)
                -> E.R.toOption
                -> E.O.flatten
            switch expected {  // not exactly happy with this
                | None => false -> expect -> toBe(true)
                | Some(x) => switch calculated {
                    | None => false -> expect -> toBe(true)
                    | Some(y) => x -> expect -> toBeSoCloseTo(y, ~digits=-1)
                }
            }
        })


    })
})