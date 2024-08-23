import { BaseDist } from "../dists/BaseDist.js";
import { argumentError } from "../dists/DistError.js";
import * as distOperations from "../dists/distOperations/index.js";
import { ErrorMessage } from "../errors/messages.js";
import { frInput } from "../library/FrInput.js";
import {
  frArray,
  frDist,
  frDistOrNumber,
  frNumber,
  frTuple,
} from "../library/FrType.js";
import {
  parseDistFromDistOrNumber,
  unwrapDistResult,
} from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { Reducer } from "../reducer/Reducer.js";
import * as E_A from "../utility/E_A.js";

function mixtureWithGivenWeights(
  distributions: BaseDist[],
  weights: readonly number[],
  reducer: Reducer
): BaseDist {
  return unwrapDistResult(
    distOperations.mixture(E_A.zip(distributions, weights), {
      env: reducer.environment,
      rng: reducer.rng,
    })
  );
}

function mixtureWithDefaultWeights(
  distributions: BaseDist[],
  reducer: Reducer
) {
  const length = distributions.length;
  const weights = new Array(length).fill(1 / length);
  return mixtureWithGivenWeights(distributions, weights, reducer);
}

const asArrays = makeDefinition(
  [
    frArray(frDistOrNumber),
    frInput({ name: "weights", type: frArray(frNumber), optional: true }),
  ],
  frDist,
  ([dists, weights], reducer) => {
    if (weights) {
      if (dists.length !== weights.length) {
        throw ErrorMessage.distributionError(
          argumentError(
            "Error, mixture call has different number of distributions and weights"
          )
        );
      }
      return mixtureWithGivenWeights(
        dists.map(parseDistFromDistOrNumber),
        weights,
        reducer
      );
    } else {
      return mixtureWithDefaultWeights(
        dists.map(parseDistFromDistOrNumber),
        reducer
      );
    }
  }
);

const asArguments = [
  makeDefinition([frDistOrNumber], frDist, ([dist1], reducer) =>
    mixtureWithDefaultWeights([dist1].map(parseDistFromDistOrNumber), reducer)
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frInput({
        name: "weights",
        type: frTuple(frNumber, frNumber),
        optional: true,
      }),
    ],
    frDist,
    ([dist1, dist2, weights], reducer) =>
      weights
        ? mixtureWithGivenWeights(
            [dist1, dist2].map(parseDistFromDistOrNumber),
            weights,
            reducer
          )
        : mixtureWithDefaultWeights(
            [dist1, dist2].map(parseDistFromDistOrNumber),
            reducer
          )
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frInput({
        name: "weights",
        type: frTuple(frNumber, frNumber, frNumber),
        optional: true,
      }),
    ],
    frDist,
    ([dist1, dist2, dist3, weights], reducer) =>
      weights
        ? mixtureWithGivenWeights(
            [dist1, dist2, dist3].map(parseDistFromDistOrNumber),
            weights,
            reducer
          )
        : mixtureWithDefaultWeights(
            [dist1, dist2, dist3].map(parseDistFromDistOrNumber),
            reducer
          )
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frInput({
        name: "weights",
        type: frTuple(frNumber, frNumber, frNumber, frNumber),
        optional: true,
      }),
    ],
    frDist,
    ([dist1, dist2, dist3, dist4, weights], reducer) =>
      weights
        ? mixtureWithGivenWeights(
            [dist1, dist2, dist3, dist4].map(parseDistFromDistOrNumber),
            weights,
            reducer
          )
        : mixtureWithDefaultWeights(
            [dist1, dist2, dist3, dist4].map(parseDistFromDistOrNumber),
            reducer
          )
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frInput({
        name: "weights",
        type: frTuple(frNumber, frNumber, frNumber, frNumber, frNumber),
        optional: true,
      }),
    ],
    frDist,
    ([dist1, dist2, dist3, dist4, dist5, weights], reducer) =>
      weights
        ? mixtureWithGivenWeights(
            [dist1, dist2, dist3, dist4, dist5].map(parseDistFromDistOrNumber),
            weights,
            reducer
          )
        : mixtureWithDefaultWeights(
            [dist1, dist2, dist3, dist4, dist5].map(parseDistFromDistOrNumber),
            reducer
          )
  ),
];

export const mixtureDefinitions = [asArrays, ...asArguments];
