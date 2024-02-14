import { BaseDist } from "../dist/BaseDist.js";
import { argumentError } from "../dist/DistError.js";
import * as distOperations from "../dist/distOperations/index.js";
import { REDistributionError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDist,
  frDistOrNumber,
  frNamed,
  frNumber,
  frOptional,
  frTuple,
} from "../library/registry/frTypes.js";
import {
  parseDistFromDistOrNumber,
  unwrapDistResult,
} from "../library/registry/helpers.js";
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
  [frArray(frDistOrNumber), frNamed("weights", frOptional(frArray(frNumber)))],
  frDist,
  ([dists, weights], reducer) => {
    if (weights) {
      if (dists.length !== weights.length) {
        throw new REDistributionError(
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
      frNamed("weights", frOptional(frTuple(frNumber, frNumber))),
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
      frNamed("weights", frOptional(frTuple(frNumber, frNumber, frNumber))),
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
      frNamed(
        "weights",
        frOptional(frTuple(frNumber, frNumber, frNumber, frNumber))
      ),
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
      frNamed(
        "weights",
        frOptional(frTuple(frNumber, frNumber, frNumber, frNumber, frNumber))
      ),
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
