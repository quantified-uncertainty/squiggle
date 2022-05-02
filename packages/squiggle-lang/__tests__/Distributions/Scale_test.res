/*
This test case comes via Nuño https://github.com/quantified-uncertainty/squiggle/issues/433


*/

open Jest
open Expect
open TestHelpers

describe("Scale logarithm", () => {
  test("mean of the base two scalar logarithm of an exponential(10)", () => {
    let scalelog = DistributionOperation.Constructors.scaleLogarithm(~env, mkExponential(10.0), 2.0)

    E.R2.bind(DistributionOperation.Constructors.mean(~env), scalelog)
    ->expect
    ->toEqual(Ok(-2.348336572091017))
  })
})
