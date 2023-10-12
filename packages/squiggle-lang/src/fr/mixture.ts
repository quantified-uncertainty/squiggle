import { BaseDist } from "../dist/BaseDist.js";
import { argumentError } from "../dist/DistError.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import * as distOperations from "../dist/distOperations/index.js";
import { Env } from "../dist/env.js";
import { unpackDistResult } from "../library/registry/helpers.js";
import { REDistributionError } from "../errors/messages.js";
import { BuiltinLambda } from "../reducer/lambda.js";
import * as E_A from "../utility/E_A.js";
import { Value, vDist } from "../value/index.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDistOrNumber,
  frNumber,
  frTuple,
} from "../library/registry/frTypes.js";

function parseDistFromType(d: number | BaseDist): BaseDist {
  if (d instanceof BaseDist) {
    return d;
  } else {
    return new SymbolicDist.PointMass(d);
  }
}

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

function mixtureWithWeightsAndMapping(
  dists: (number | BaseDist)[],
  weights: number[],
  environment: any
): Value {
  return mixtureWithGivenWeights(
    dists.map(parseDistFromType),
    weights,
    environment
  );
}

const singleArrayDef = makeDefinition(
  [frArray(frDistOrNumber)],
  ([ar], { environment }) =>
    mixtureWithDefaultWeights(ar.map(parseDistFromType), environment)
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
      dists.map(parseDistFromType),
      weights,
      environment
    );
  }
);

const twoToFiveDistsWithWeightsDefs = [
  makeDefinition(
    [frDistOrNumber, frDistOrNumber, frTuple(frNumber, frNumber)],
    ([dist1, dist2, weights], { environment }) =>
      mixtureWithWeightsAndMapping([dist1, dist2], weights, environment)
  ),
  makeDefinition(
    [
      frDistOrNumber,
      frDistOrNumber,
      frDistOrNumber,
      frTuple(frNumber, frNumber, frNumber),
    ],
    ([dist1, dist2, dist3, weights], { environment }) =>
      mixtureWithWeightsAndMapping([dist1, dist2, dist3], weights, environment)
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
      mixtureWithWeightsAndMapping(
        [dist1, dist2, dist3, dist4],
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
      mixtureWithWeightsAndMapping(
        [dist1, dist2, dist3, dist4, dist5],
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
      mixtureWithDefaultWeights(args.map(parseDistFromType), environment)
  );
});

const defs = [
  singleArrayDef,
  twoArraysDef,
  ...twoToFiveDistsWithWeightsDefs,
  ...oneToFiveDistsDefs,
];

export const mxLambda = () => new BuiltinLambda("mx", defs);
