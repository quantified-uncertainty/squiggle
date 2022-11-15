open Jest
open Expect
open TestHelpers
open GenericDist_Fixtures

let klDivergence = DistributionOperation.Constructors.LogScore.distEstimateDistAnswer(~env)
// integral from low to high of 1 / (high - low) log(normal(mean, stdev)(x) / (1 / (high - low))) dx
let klNormalUniform = (mean, stdev, low, high): float =>
  -.Js.Math.log((high -. low) /. Js.Math.sqrt(2.0 *. MagicNumbers.Math.pi *. stdev ** 2.0)) +.
  1.0 /.
  stdev ** 2.0 *.
  (mean ** 2.0 -. (high +. low) *. mean +. (low ** 2.0 +. high *. low +. high ** 2.0) /. 3.0)

describe("klDivergence: continuous -> continuous -> float", () => {
  let testUniform = (lowAnswer, highAnswer, lowPrediction, highPrediction) => {
    test("of two uniforms is equal to the analytic expression", () => {
      let answer =
        uniformMakeR(lowAnswer, highAnswer)->E.R.errMap(s => DistributionTypes.ArgumentError(s))
      let prediction =
        uniformMakeR(lowPrediction, highPrediction)->E.R.errMap(
          s => DistributionTypes.ArgumentError(s),
        )
      // integral along the support of the answer of answer.pdf(x) times log of prediction.pdf(x) divided by answer.pdf(x) dx
      let analyticalKl = Js.Math.log((highPrediction -. lowPrediction) /. (highAnswer -. lowAnswer))
      let kl = E.R.liftJoin2(klDivergence, prediction, answer)
      switch kl {
      | Ok(kl') => kl'->expect->toBeSoCloseTo(analyticalKl, ~digits=7)
      | Error(err) => {
          Js.Console.log(DistributionTypes.Error.toString(err))
          raise(KlFailed)
        }
      }
    })
  }
  // The pair on the right (the answer) can be wider than the pair on the left (the prediction), but not the other way around.
  testUniform(0.0, 1.0, -1.0, 2.0)
  testUniform(0.0, 1.0, 0.0, 2.0) // equal left endpoints
  testUniform(0.0, 1.0, -1.0, 1.0) // equal rightendpoints
  testUniform(0.0, 1e1, 0.0, 1e1) // equal (klDivergence = 0)
  // testUniform(-1.0, 1.0, 0.0, 2.0)

  test("of two normals is equal to the formula", () => {
    // This test case comes via Nuño https://github.com/quantified-uncertainty/squiggle/issues/433
    let mean1 = 4.0
    let mean2 = 1.0
    let stdev1 = 4.0
    let stdev2 = 1.0

    let prediction = normalMakeR(mean1, stdev1)->E.R.errMap(s => DistributionTypes.ArgumentError(s))
    let answer = normalMakeR(mean2, stdev2)->E.R.errMap(s => DistributionTypes.ArgumentError(s))
    // https://stats.stackexchange.com/questions/7440/kl-divergence-between-two-univariate-gaussians
    let analyticalKl =
      Js.Math.log(stdev1 /. stdev2) +.
      (stdev2 ** 2.0 +. (mean2 -. mean1) ** 2.0) /. (2.0 *. stdev1 ** 2.0) -. 0.5
    let kl = E.R.liftJoin2(klDivergence, prediction, answer)

    switch kl {
    | Ok(kl') => kl'->expect->toBeSoCloseTo(analyticalKl, ~digits=2)
    | Error(err) => {
        Js.Console.log(DistributionTypes.Error.toString(err))
        raise(KlFailed)
      }
    }
  })

  test("of a normal and a uniform is equal to the formula", () => {
    let prediction = normalDist10
    let answer = uniformDist
    let kl = klDivergence(prediction, answer)
    let analyticalKl = klNormalUniform(10.0, 2.0, 9.0, 10.0)
    switch kl {
    | Ok(kl') => kl'->expect->toBeSoCloseTo(analyticalKl, ~digits=1)
    | Error(err) => {
        Js.Console.log(DistributionTypes.Error.toString(err))
        raise(KlFailed)
      }
    }
  })
})

describe("klDivergence: discrete -> discrete -> float", () => {
  let mixture = a => DistributionTypes.DistributionOperation.Mixture(a)
  let a' = [(point1, 1e0), (point2, 1e0)]->mixture->run
  let b' = [(point1, 1e0), (point2, 1e0), (point3, 1e0)]->mixture->run
  let (a, b) = switch (a', b') {
  | (Dist(a''), Dist(b'')) => (a'', b'')
  | _ => raise(MixtureFailed)
  }
  test("agrees with analytical answer when finite", () => {
    let prediction = b
    let answer = a
    let kl = klDivergence(prediction, answer)
    // Sigma_{i \in 1..2} 0.5 * log(0.5 / 0.33333)
    let analyticalKl = Js.Math.log(3.0 /. 2.0)
    switch kl {
    | Ok(kl') => kl'->expect->toBeSoCloseTo(analyticalKl, ~digits=7)
    | Error(err) =>
      Js.Console.log(DistributionTypes.Error.toString(err))
      raise(KlFailed)
    }
  })
  test("returns infinity when infinite", () => {
    let prediction = a
    let answer = b
    let kl = klDivergence(prediction, answer)
    switch kl {
    | Ok(kl') => kl'->expect->toEqual(infinity)
    | Error(err) =>
      Js.Console.log(DistributionTypes.Error.toString(err))
      raise(KlFailed)
    }
  })
})

describe("klDivergence: mixed -> mixed -> float", () => {
  let mixture' = a => DistributionTypes.DistributionOperation.Mixture(a)
  let mixture = a => {
    let dist' = a->mixture'->run
    switch dist' {
    | Dist(dist) => dist
    | _ => raise(MixtureFailed)
    }
  }
  let a = [(point1, 1.0), (uniformDist, 1.0)]->mixture
  let b = [(point1, 1.0), (floatDist, 1.0), (normalDist10, 1.0)]->mixture
  let c = [(point1, 1.0), (point2, 1.0), (point3, 1.0), (uniformDist, 1.0)]->mixture
  let d =
    [(point1, 1.0), (point2, 1.0), (point3, 1.0), (floatDist, 1.0), (uniformDist2, 1.0)]->mixture

  test("finite klDivergence produces correct answer", () => {
    let prediction = b
    let answer = a
    let kl = klDivergence(prediction, answer)
    // high = 10; low = 9; mean = 10; stdev = 2
    let analyticalKlContinuousPart = klNormalUniform(10.0, 2.0, 9.0, 10.0) /. 2.0
    let analyticalKlDiscretePart = 1.0 /. 2.0 *. Js.Math.log(2.0 /. 1.0)
    switch kl {
    | Ok(kl') =>
      kl'->expect->toBeSoCloseTo(analyticalKlContinuousPart +. analyticalKlDiscretePart, ~digits=1)
    | Error(err) =>
      Js.Console.log(DistributionTypes.Error.toString(err))
      raise(KlFailed)
    }
  })
  test("returns infinity when infinite", () => {
    let prediction = a
    let answer = b
    let kl = klDivergence(prediction, answer)
    switch kl {
    | Ok(kl') => kl'->expect->toEqual(infinity)
    | Error(err) =>
      Js.Console.log(DistributionTypes.Error.toString(err))
      raise(KlFailed)
    }
  })
  test("finite klDivergence produces correct answer", () => {
    let prediction = d
    let answer = c
    let kl = klDivergence(prediction, answer)
    let analyticalKlContinuousPart = Js.Math.log((11.0 -. 8.0) /. (10.0 -. 9.0)) /. 4.0 // 4 = length of c' array
    let analyticalKlDiscretePart = 3.0 /. 4.0 *. Js.Math.log(4.0 /. 3.0)
    switch kl {
    | Ok(kl') =>
      kl'->expect->toBeSoCloseTo(analyticalKlContinuousPart +. analyticalKlDiscretePart, ~digits=1)
    | Error(err) =>
      Js.Console.log(DistributionTypes.Error.toString(err))
      raise(KlFailed)
    }
  })
})

describe("combineAlongSupportOfSecondArgument0", () => {
  // This tests the version of the function that we're NOT using. Haven't deleted the test in case we use the code later.
  test("test on two uniforms", _ => {
    let combineAlongSupportOfSecondArgument = XYShape.PointwiseCombination.combineAlongSupportOfSecondArgument0
    let lowAnswer = 0.0
    let highAnswer = 1.0
    let lowPrediction = 0.0
    let highPrediction = 2.0

    let answer =
      uniformMakeR(lowAnswer, highAnswer)->E.R.errMap(s => DistributionTypes.ArgumentError(s))
    let prediction =
      uniformMakeR(lowPrediction, highPrediction)->E.R.errMap(
        s => DistributionTypes.ArgumentError(s),
      )
    let answerWrapped = E.R.fmap(answer, a => run(FromDist(#ToDist(ToPointSet), a)))
    let predictionWrapped = E.R.fmap(prediction, a => run(FromDist(#ToDist(ToPointSet), a)))

    let interpolator = XYShape.XtoY.continuousInterpolator(#Stepwise, #UseZero)
    let integrand = PointSetDist_Scoring.WithDistAnswer.integrand

    let result = switch (answerWrapped, predictionWrapped) {
    | (Ok(Dist(PointSet(Continuous(a)))), Ok(Dist(PointSet(Continuous(b))))) =>
      Some(combineAlongSupportOfSecondArgument(interpolator, integrand, a.xyShape, b.xyShape))
    | _ => None
    }
    result
    ->expect
    ->toEqual(
      Some(
        Ok({
          xs: [
            0.0,
            MagicNumbers.Epsilon.ten,
            2.0 *. MagicNumbers.Epsilon.ten,
            1.0 -. MagicNumbers.Epsilon.ten,
            1.0,
            1.0 +. MagicNumbers.Epsilon.ten,
          ],
          ys: [
            -0.34657359027997264,
            -0.34657359027997264,
            -0.34657359027997264,
            -0.34657359027997264,
            -0.34657359027997264,
            infinity,
          ],
        }),
      ),
    )
  })
})
