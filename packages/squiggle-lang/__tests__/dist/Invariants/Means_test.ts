/*
This is the most basic file in our invariants family of tests. 

Validate that the addition of means equals the mean of the addition, similar for subtraction and multiplication. 

Details in https://squiggle-language.com/docs/internal/invariants/

Note: epsilon of 1e3 means the invariants are, in general, not being satisfied. 
*/

import { BaseDist } from "../../../src/dist/BaseDist.js";
import {
  env,
  mkBeta,
  mkPointMass,
  mkExponential,
  mkLognormal,
  mkNormal,
  mkTriangular,
  mkUniform,
  unpackResult,
} from "../../helpers/distHelpers.js";
import {
  binaryOperations,
  BinaryOperation,
} from "../../../src/dist/distOperations/index.js";
import { Env } from "../../../src/dist/env.js";
import { expectErrorToBeBounded } from "../../helpers/helpers.js";

const epsilon = 5e1;

const distributions = [
  mkNormal(4, 1),
  mkBeta(2, 4),
  mkExponential(1.234),
  mkUniform(7, 1e1),
  // cauchyMake(1e0, 1e0),
  mkLognormal(2, 1),
  mkTriangular(1, 1e1, 5e1),
  mkPointMass(1e1),
];

const combinations2 = <T>(arr: T[]): [T, T][] => {
  const result: [T, T][] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      result.push([arr[i], arr[j]]);
    }
  }
  return result;
};
const pairsOfDifferentDistributions = combinations2(distributions);

const testOperationMean = (
  distOp: BinaryOperation,
  floatOp: (v1: number, v2: number) => number,
  dist1: BaseDist,
  dist2: BaseDist,
  { epsilon, env }: { epsilon: number; env: Env }
) => {
  const received = unpackResult(distOp(dist1, dist2, { env })).mean();

  const expected = floatOp(dist1.mean(), dist2.mean());

  expectErrorToBeBounded(received, expected, { epsilon });
};

const {
  algebraicAdd,
  algebraicMultiply,
  // algebraicDivide,
  algebraicSubtract,
  // algebraicLogarithm,
  // algebraicPower,
} = binaryOperations;

describe("Means are invariant", () => {
  describe.each([
    ["addition", algebraicAdd, (v1: number, v2: number) => v1 + v2],
    ["subtraction", algebraicSubtract, (v1: number, v2: number) => v1 - v2],
    ["multiply", algebraicMultiply, (v1: number, v2: number) => v1 * v2],
  ])("for %s", (description, binaryOp, floatOp) => {
    const testMean = (dist1: BaseDist, dist2: BaseDist) =>
      testOperationMean(binaryOp, floatOp, dist1, dist2, { epsilon, env });

    test.each(distributions)(
      "with two of the same distribution (%s)",
      (dist) => {
        testMean(dist, dist);
      }
    );

    test.each(pairsOfDifferentDistributions)(
      "with two different distributions (%s, %s)",
      (dist1, dist2) => {
        testMean(dist1, dist2);
      }
    );

    test.each(pairsOfDifferentDistributions)(
      "with two different distributions in swapped order (%s, %s)",
      (dist1, dist2) => {
        testMean(dist2, dist1);
      }
    );
  });
});
