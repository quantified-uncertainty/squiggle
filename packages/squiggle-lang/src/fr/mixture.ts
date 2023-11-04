import { BaseDist } from "../dist/BaseDist.js";
import { argumentError } from "../dist/DistError.js";
import * as distOperations from "../dist/distOperations/index.js";
import { Env } from "../dist/env.js";
import {
  parseDistFromDistOrNumber,
  unpackDistResult,
} from "../library/registry/helpers.js";
import { REDistributionError } from "../errors/messages.js";
import * as E_A from "../utility/E_A.js";
import { Value, vDist } from "../value/index.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDistOrNumber,
  frNumber,
  frTuple,
} from "../library/registry/frTypes.js";

function mixtureWithGivenWeights(
  distributions: BaseDist[],
  weights: number[],
  env: Env
): Value {
  return vDist(
    unpackDistResult(
      distOperations.mixture(E_A.zip(distributions, weights), { env })
    )
  );
}

function mixtureWithDefaultWeights(distributions: BaseDist[], env: Env) {
  const length = distributions.length;
  const weights = new Array(length).fill(1 / length);
  return mixtureWithGivenWeights(distributions, weights, env);
}

const singleArrayDef = makeDefinition(
  [frArray(frDistOrNumber)],
  ([ar], { environment }) =>
    mixtureWithDefaultWeights(ar.map(parseDistFromDistOrNumber), environment)
);

const twoArraysDef = makeDefinition(
  [frArray(frDistOrNumber), frArray(frNumber)],
  ([dists, weights], { environment }) => {
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
      environment
    );
  }
);

const twoToFiveDistsWithWeightsDefs = [
  makeDefinition(
    [frDistOrNumber, frDistOrNumber, frTuple(frNumber, frNumber)],
    ([dist1, dist2, weights], { environment }) =>
      mixtureWithGivenWeights(
        [dist1, dist2].map(parseDistFromDistOrNumber),
        weights,
        environment
      )
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frTuple(frNumber, frNumber, frNumber),
    ],
    ([dist1, dist2, dist3, weights], { environment }) =>
      mixtureWithGivenWeights(
        [dist1, dist2, dist3].map(parseDistFromDistOrNumber),
        weights,
        environment
      )
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frTuple(frNumber, frNumber, frNumber, frNumber),
    ],
    ([dist1, dist2, dist3, dist4, weights], { environment }) =>
      mixtureWithGivenWeights(
        [dist1, dist2, dist3, dist4].map(parseDistFromDistOrNumber),
        weights,
        environment
      )
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frTuple(frNumber, frNumber, frNumber, frNumber, frNumber),
    ],
    ([dist1, dist2, dist3, dist4, dist5, weights], { environment }) =>
      mixtureWithGivenWeights(
        [dist1, dist2, dist3, dist4, dist5].map(parseDistFromDistOrNumber),
        weights,
        environment
      )
  ),
];

const oneToFiveDistsDefs = Array.from({ length: 5 }, (_, i) => {
  const frArgs = new Array(i + 1).fill(frDistOrNumber);
  return makeDefinition(
    frArgs,
    (args: (number | BaseDist)[], { environment }) =>
      mixtureWithDefaultWeights(
        args.map(parseDistFromDistOrNumber),
        environment
      )
  );
});

export const mixtureDefinitions = [
  singleArrayDef,
  twoArraysDef,
  ...twoToFiveDistsWithWeightsDefs,
  ...oneToFiveDistsDefs,
];
