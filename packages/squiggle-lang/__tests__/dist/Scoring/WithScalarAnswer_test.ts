import { mixture } from "../../../src/dist/distOperations/index.js";
import { logScoreScalarAnswer } from "../../../src/dist/scoring/ScalarAnswer.js";
import { getDefaultRng } from "../../../src/rng/index.js";
import { env, mkPointMass, unpackResult } from "../../helpers/distHelpers.js";

const rng = getDefaultRng();

describe("WithScalarAnswer: discrete -> scalar -> score", () => {
  const pointA = mkPointMass(3.0);
  const pointB = mkPointMass(2.0);
  const pointC = mkPointMass(1.0);
  const pointD = mkPointMass(0.0);

  test.only("score: agrees with analytical answer when finite", () => {
    const prediction = unpackResult(
      mixture(
        [
          [pointA, 0.25],
          [pointB, 0.25],
          [pointC, 0.25],
          [pointD, 0.25],
        ],
        { env, rng }
      )
    );

    const answer = 2.0; // So this is: assigning 100% probability to 2.0
    const x = logScoreScalarAnswer({
      estimate: prediction,
      answer,
      env,
    }).getOrThrow().discrete;
    expect(x).toEqual(-Math.log(0.25 / 1.0));
  });

  test("score: agrees with analytical answer when finite", () => {
    const prediction = unpackResult(
      mixture(
        [
          [pointA, 0.75],
          [pointB, 0.25],
        ],
        { env, rng }
      )
    );

    const answer = 3.0; // So this is: assigning 100% probability to 2.0
    const x = unpackResult(
      logScoreScalarAnswer({
        estimate: prediction,
        answer,
        env,
      })
    );
    expect(x).toEqual(-Math.log(0.75 / 1.0));
  });
});
