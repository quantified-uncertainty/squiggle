open Jest
open Expect
open TestHelpers

describe("kl divergence", () => {
  let klDivergence = DistributionOperation.Constructors.klDivergence(~env)
  test("", () => {
    exception KlFailed
    let lowAnswer = 4.3526e0
    let highAnswer = 8.5382e0
    let lowPrediction = 4.3526e0
    let highPrediction = 1.2345e1
    let answer =
      uniformMakeR(lowAnswer, highAnswer)->E.R2.errMap(s => DistributionTypes.ArgumentError(s))
    let prediction =
      uniformMakeR(lowPrediction, highPrediction)->E.R2.errMap(s => DistributionTypes.ArgumentError(
        s,
      ))
    // integral along the support of the answer of answer.pdf(x) times log of prediction.pdf(x) divided by answer.pdf(x) dx
    let analyticalKl =
      -1.0 /.
      (highAnswer -. lowAnswer) *.
      Js.Math.log((highAnswer -. lowAnswer) /. (highPrediction -. lowPrediction)) *.
      (highAnswer -. lowAnswer)
    let kl = E.R.liftJoin2(klDivergence, prediction, answer)
    switch kl {
    | Ok(kl') => kl'->expect->toBeCloseTo(analyticalKl)
    | Error(err) => {
        Js.Console.log(DistributionTypes.Error.toString(err))
        raise(KlFailed)
      }
    }
  })
})
