open Jest
open Expect
open TestHelpers

describe("Scale logarithm", () => {
  /* These tests may not be important, because scalelog isn't normalized
  The first one may be failing for a number of reasons.
 */
  Skip.test("mean of the base e scalar logarithm of an exponential(10)", () => {
    let rate = 10.0
    let scalelog = DistributionOperation.Constructors.scaleLogarithm(
      ~env,
      mkExponential(rate),
      MagicNumbers.Math.e,
    )

    let meanResult = E.R.bind(scalelog, DistributionOperation.Constructors.mean(~env))
    // expected value of log of exponential distribution.
    let meanAnalytical = Js.Math.log(rate) +. 1.0
    switch meanResult {
    | Ok(meanValue) => meanValue->expect->toBeCloseTo(meanAnalytical)
    | Error(err) => err->expect->toBe(DistributionTypes.OperationError(DivisionByZeroError))
    }
  })
  let low = 10.0
  let high = 100.0
  let scalelog = DistributionOperation.Constructors.scaleLogarithm(~env, mkUniform(low, high), 2.0)

  test("mean of the base 2 scalar logarithm of a uniform(10, 100)", () => {
    //For uniform pdf `_ => 1 / (b - a)`, the expected value of log of uniform is `integral from a to b of x * log(1 / (b -a)) dx`
    let meanResult = E.R.bind(scalelog, DistributionOperation.Constructors.mean(~env))
    let meanAnalytical = -.Js.Math.log2(high -. low) /. 2.0 *. (high ** 2.0 -. low ** 2.0) // -. Js.Math.log2(high -. low)
    switch meanResult {
    | Ok(meanValue) => meanValue->expect->toBeCloseTo(meanAnalytical)
    | Error(err) => err->expect->toEqual(DistributionTypes.OperationError(NegativeInfinityError))
    }
  })
})
