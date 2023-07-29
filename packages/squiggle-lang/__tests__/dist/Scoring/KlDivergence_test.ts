import { BaseDist } from "../../../src/dist/BaseDist.js";
import { distErrorToString } from "../../../src/dist/DistError.js";
import {
  logScoreDistAnswer,
  mixture,
} from "../../../src/dist/distOperations/index.js";
import {
  env,
  mkNormal,
  mkUniform,
  unpackResult,
} from "../../helpers/distHelpers.js";
import {
  floatDist,
  normalDist10,
  point1,
  point2,
  point3,
  uniformDist,
  uniformDist2,
} from "../../fixtures/distFixtures.js";

const klDivergence = (prediction: BaseDist, answer: BaseDist): number => {
  const result = logScoreDistAnswer({
    estimate: prediction,
    answer,
    prior: undefined,
    env,
  });
  if (!result.ok) {
    console.log(distErrorToString(result.value));
    throw new Error("logScore failed");
  }
  return result.value;
};

// integral from low to high of 1 / (high - low) log(normal(mean, stdev)(x) / (1 / (high - low))) dx
const klNormalUniform = (
  mean: number,
  stdev: number,
  low: number,
  high: number
): number =>
  -Math.log((high - low) / Math.sqrt(2 * Math.PI * stdev ** 2)) +
  (1 / stdev ** 2) *
    (mean ** 2 - (high + low) * mean + (low ** 2 + high * low + high ** 2) / 3);

describe("klDivergence: continuous -> continuous -> float", () => {
  const testUniform = (
    lowAnswer: number,
    highAnswer: number,
    lowPrediction: number,
    highPrediction: number
  ) => {
    test("of two uniforms is equal to the analytic expression", () => {
      const answer = mkUniform(lowAnswer, highAnswer);
      const prediction = mkUniform(lowPrediction, highPrediction);

      // integral along the support of the answer of answer.pdf(x) times log of prediction.pdf(x) divided by answer.pdf(x) dx
      const analyticalKl = Math.log(
        (highPrediction - lowPrediction) / (highAnswer - lowAnswer)
      );
      const kl = klDivergence(prediction, answer);
      expect(kl).toBeCloseTo(analyticalKl, 7);
    });
  };
  // The pair on the right (the answer) can be wider than the pair on the left (the prediction), but not the other way around.
  testUniform(0.0, 1.0, -1.0, 2.0);
  testUniform(0.0, 1.0, 0.0, 2.0); // equal left endpoints
  testUniform(0.0, 1.0, -1.0, 1.0); // equal rightendpoints
  testUniform(0.0, 1e1, 0.0, 1e1); // equal (klDivergence = 0)
  // testUniform(-1.0, 1.0, 0.0, 2.0)

  test("of two normals is equal to the formula", () => {
    // This test case comes via Nuño https://github.com/quantified-uncertainty/squiggle/issues/433
    const mean1 = 4.0;
    const mean2 = 1.0;
    const stdev1 = 4.0;
    const stdev2 = 1.0;

    const prediction = mkNormal(mean1, stdev1);
    const answer = mkNormal(mean2, stdev2);
    // https://stats.stackexchange.com/questions/7440/kl-divergence-between-two-univariate-gaussians
    const analyticalKl =
      Math.log(stdev1 / stdev2) +
      (stdev2 ** 2 + (mean2 - mean1) ** 2) / (2 * stdev1 ** 2) -
      0.5;
    const kl = klDivergence(prediction, answer);

    expect(kl).toBeCloseTo(analyticalKl, 2);
  });

  test("of a normal and a uniform is equal to the formula", () => {
    const prediction = normalDist10;
    const answer = uniformDist;
    const kl = klDivergence(prediction, answer);
    const analyticalKl = klNormalUniform(10.0, 2.0, 9.0, 10.0);
    expect(kl).toBeCloseTo(analyticalKl, 1);
  });
});

describe("klDivergence: discrete -> discrete -> float", () => {
  const a = unpackResult(
    mixture(
      [
        [point1, 1],
        [point2, 1],
      ],
      { env }
    )
  );
  const b = unpackResult(
    mixture(
      [
        [point1, 1],
        [point2, 1],
        [point3, 1],
      ],
      { env }
    )
  );

  test("agrees with analytical answer when finite", () => {
    const prediction = b;
    const answer = a;
    const kl = klDivergence(prediction, answer);
    // Sigma_{i \in 1..2} 0.5 * log(0.5 / 0.33333)
    const analyticalKl = Math.log(3 / 2);
    expect(kl).toBeCloseTo(analyticalKl, 7);
  });
  test("returns infinity when infinite", () => {
    const prediction = a;
    const answer = b;
    const kl = klDivergence(prediction, answer);
    expect(kl).toEqual(Infinity);
  });
});

describe("klDivergence: mixed -> mixed -> float", () => {
  const a = unpackResult(
    mixture(
      [
        [point1, 1.0],
        [uniformDist, 1.0],
      ],
      { env }
    )
  );
  const b = unpackResult(
    mixture(
      [
        [point1, 1.0],
        [floatDist, 1.0],
        [normalDist10, 1.0],
      ],
      { env }
    )
  );
  const c = unpackResult(
    mixture(
      [
        [point1, 1.0],
        [point2, 1.0],
        [point3, 1.0],
        [uniformDist, 1.0],
      ],
      { env }
    )
  );
  const d = unpackResult(
    mixture(
      [
        [point1, 1.0],
        [point2, 1.0],
        [point3, 1.0],
        [floatDist, 1.0],
        [uniformDist2, 1.0],
      ],
      { env }
    )
  );

  test("finite klDivergence produces correct answer", () => {
    const prediction = b;
    const answer = a;
    const kl = klDivergence(prediction, answer);
    // high = 10; low = 9; mean = 10; stdev = 2
    const analyticalKlContinuousPart = klNormalUniform(10, 2, 9, 10) / 2;
    const analyticalKlDiscretePart = (1 / 2) * Math.log(2 / 1);
    expect(kl).toBeCloseTo(
      analyticalKlContinuousPart + analyticalKlDiscretePart,
      1
    );
  });
  test("returns infinity when infinite", () => {
    const prediction = a;
    const answer = b;
    const kl = klDivergence(prediction, answer);
    expect(kl).toEqual(Infinity);
  });
  test("finite klDivergence produces correct answer", () => {
    const prediction = d;
    const answer = c;
    const kl = klDivergence(prediction, answer);
    const analyticalKlContinuousPart = Math.log((11 - 8) / (10 - 9)) / 4; // 4 = length of c' array
    const analyticalKlDiscretePart = (3 / 4) * Math.log(4 / 3);
    expect(kl).toBeCloseTo(
      analyticalKlContinuousPart + analyticalKlDiscretePart,
      1
    );
  });
});

// describe("combineAlongSupportOfSecondArgument0", () => {
//   // This tests the version of the function that we're NOT using. Haven't deleted the test in case we use the code later.
//   test("test on two uniforms", _ => {
//     let combineAlongSupportOfSecondArgument = XYShape.PointwiseCombination.combineAlongSupportOfSecondArgument0
//     let lowAnswer = 0.0
//     let highAnswer = 1.0
//     let lowPrediction = 0.0
//     let highPrediction = 2.0

//     let answer =
//       uniformMakeR(lowAnswer, highAnswer)->E.R.errMap(s => DistributionTypes.ArgumentError(s))
//     let prediction =
//       uniformMakeR(lowPrediction, highPrediction)->E.R.errMap(
//         s => DistributionTypes.ArgumentError(s),
//       )
//     let answerWrapped = E.R.bind(answer, a => GenericDist.toPointSet(a, ~env, ()))
//     let predictionWrapped = E.R.bind(prediction, a => GenericDist.toPointSet(a, ~env, ()))

//     let interpolator = XYShape.XtoY.continuousInterpolator(#Stepwise, #UseZero)
//     let integrand = PointSetDist_Scoring.WithDistAnswer.integrand

//     let result = switch (answerWrapped, predictionWrapped) {
//     | (Ok(Continuous(a)), Ok(Continuous(b))) =>
//       Some(combineAlongSupportOfSecondArgument(interpolator, integrand, a.xyShape, b.xyShape))
//     | _ => None
//     }
//     result
//     ->expect
//     ->toEqual(
//       Some(
//         Ok({
//           xs: [
//             0.0,
//             MagicNumbers.Epsilon.ten,
//             2.0 *. MagicNumbers.Epsilon.ten,
//             1.0 -. MagicNumbers.Epsilon.ten,
//             1.0,
//             1.0 +. MagicNumbers.Epsilon.ten,
//           ],
//           ys: [
//             -0.34657359027997264,
//             -0.34657359027997264,
//             -0.34657359027997264,
//             -0.34657359027997264,
//             -0.34657359027997264,
//             infinity,
//           ],
//         }),
//       ),
//     )
//   })
// })
