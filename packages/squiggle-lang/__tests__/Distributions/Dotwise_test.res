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
    exception MeanFailed
    let dotDifference = DistributionOperation.Constructors.pointwiseSubtract(
      ~env,
      mkNormal(mean, 1.0),
      mkExponential(rate),
    )
    let meanResult = E.R.bind(dotDifference, DistributionOperation.Constructors.mean(~env))
    let meanAnalytical =
      mean -.
      SymbolicDist.Exponential.mean({rate: rate})->E.R.toExn(
        "On trusted input this should never happen",
      )
    switch meanResult {
    | Ok(meanValue) => meanValue->expect->toBeCloseTo(meanAnalytical)
    | Error(_) => raise(MeanFailed)
    }
  })
  /*
    It seems like this test should work, and it's plausible that
    there's some bug in `pointwiseSubtract`
 */
  Skip.test("mean of normal minus exponential (property)", () => {
    assert_(
      property2(
        float_(),
        floatRange(1e-5, 1e5),
        (mean, rate) => {
          // We limit ourselves to stdev=1 so that the integral is trivial
          let dotDifference = DistributionOperation.Constructors.pointwiseSubtract(
            ~env,
            mkNormal(mean, 1.0),
            mkExponential(rate),
          )
          let meanResult = E.R.bind(dotDifference, DistributionOperation.Constructors.mean(~env))
          // according to algebra or random variables,
          let meanAnalytical =
            mean -.
            SymbolicDist.Exponential.mean({rate: rate})->E.R.toExn(
              "On trusted input this should never happen",
            )
          switch meanResult {
          | Ok(meanValue) => abs_float(meanValue -. meanAnalytical) /. abs_float(meanValue) < 1e-2 // 1% relative error
          | Error(err) => err === DistributionTypes.OperationError(DivisionByZeroError)
          }
        },
      ),
    )
    pass
  })
})
