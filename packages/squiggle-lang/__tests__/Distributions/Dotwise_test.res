open Jest
open Expect
open TestHelpers
open FastCheck
open Arbitrary
open Property.Sync

describe("dotSubtract", () => {
  test("mean of normal minus exponential (unit)", () => {
    let mean = 0.0
    let rate = 10.0

    let dotDifference = DistributionOperation.Constructors.pointwiseSubtract(
      ~env,
      mkNormal(mean, 1.0),
      mkExponential(rate),
    )
    let meanResult = E.R2.bind(DistributionOperation.Constructors.mean(~env), dotDifference)
    let meanAnalytical = mean -. 1.0 /. rate
    switch meanResult {
    | Ok(meanValue) => meanValue->expect->toBeCloseTo(meanAnalytical)
    | Error(err) => err->expect->toBe(DistributionTypes.OperationError(DivisionByZeroError))
    }
  })
  Skip.test("mean of normal minus exponential (property)", () => {
    assert_(
      property2(float_(), floatRange(1e-5, 1e5), (mean, rate) => {
        // We limit ourselves to stdev=1 so that the integral is trivial
        let dotDifference = DistributionOperation.Constructors.pointwiseSubtract(
          ~env,
          mkNormal(mean, 1.0),
          mkExponential(rate),
        )
        let meanResult = E.R2.bind(DistributionOperation.Constructors.mean(~env), dotDifference)
        // according to algebra or random variables,
        let meanAnalytical = mean -. 1.0 /. rate
        Js.Console.log3(
          mean,
          rate,
          E.R.fmap(x => abs_float(x -. meanAnalytical) /. abs_float(meanAnalytical), meanResult),
        )
        switch meanResult {
        | Ok(meanValue) => abs_float(meanValue -. meanAnalytical) /. abs_float(meanValue) < 1e-2 // 1% relative error
        | Error(err) => err === DistributionTypes.OperationError(DivisionByZeroError)
        }
      }),
    )
    pass
  })
})
