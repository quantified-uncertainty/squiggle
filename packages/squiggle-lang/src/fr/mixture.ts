import { BaseDist } from "../dist/BaseDist.js";
import { DistError, argumentError } from "../dist/DistError.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";
import * as distOperations from "../dist/distOperations/index.js";
import { Env } from "../dist/env.js";
import { unpackDistResult } from "../library/registry/helpers.js";
import { REDistributionError } from "../errors/messages.js";
import { BuiltinLambda } from "../reducer/lambda.js";
import * as E_A from "../utility/E_A.js";
import * as Result from "../utility/result.js";
import { Value, vDist } from "../value/index.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frDistOrNumber,
  frNumber,
} from "../library/registry/frTypes.js";

function raiseArgumentError(message: string): never {
  throw new REDistributionError(argumentError(message));
}

function parseNumber(arg: Value): number {
  if (arg.type === "Number") {
    return arg.value;
  } else {
    raiseArgumentError("Not a number");
  }
}

const parseNumberArray = (args: Value[]): number[] => args.map(parseNumber);

function parseDistFromValue(args: Value): BaseDist {
  if (args.type === "Dist") {
    return args.value;
  } else if (args.type === "Number") {
    return new SymbolicDist.PointMass(args.value);
  } else {
    raiseArgumentError("Not a distribution");
  }
}

function parseDistFromType(d: number | BaseDist): BaseDist {
  if (d instanceof BaseDist) {
    return d;
  } else {
    return new SymbolicDist.PointMass(d);
  }
}

const parseDistributionArray = (ags: Value[]): BaseDist[] =>
  ags.map(parseDistFromValue);

function mixtureWithGivenWeights(
  distributions: BaseDist[],
  weights: number[],
  env: Env
): Result.result<BaseDist, DistError> {
  if (distributions.length === weights.length) {
    return distOperations.mixture(E_A.zip(distributions, weights), { env });
  } else {
    raiseArgumentError(
      "Error, mixture call has different number of distributions and weights"
    );
  }
}

function mixtureWithDefaultWeights(distributions: BaseDist[], env: Env) {
  const length = distributions.length;
  const weights = new Array(length).fill(1 / length);
  return mixtureWithGivenWeights(distributions, weights, env);
}

const defs = [
  makeDefinition([frDistOrNumber], ([dist], { environment }) => {
    return vDist(
      unpackDistResult(
        mixtureWithDefaultWeights([parseDistFromType(dist)], environment)
      )
    );
  }),
  makeDefinition([frArray(frDistOrNumber)], ([ar], { environment }) => {
    return vDist(
      unpackDistResult(
        mixtureWithDefaultWeights(ar.map(parseDistFromType), environment)
      )
    );
  }),
  makeDefinition(
    [frArray(frDistOrNumber), frArray(frNumber)],
    ([dists, weights], { environment }) =>
      vDist(
        unpackDistResult(
          mixtureWithGivenWeights(
            dists.map(parseDistFromType),
            weights,
            environment
          )
        )
      )
  ),
  ...Array.from({ length: 9 }, (_, i) => {
    const frArgs = [frAny, ...new Array(i).fill(frAny)];
    return makeDefinition(frArgs, (args: Value[], { environment }) => {
      const last: Value = args[args.length - 1];

      function getMixture() {
        if (last.type === "Array") {
          const weights = parseNumberArray(last.value);
          const distributions = parseDistributionArray(
            args.slice(0, args.length - 1)
          );
          return mixtureWithGivenWeights(distributions, weights, environment);
        } else if (last.type === "Number" || last.type === "Dist") {
          return mixtureWithDefaultWeights(
            parseDistributionArray(args),
            environment
          );
        } else {
          raiseArgumentError(
            "Last argument of mx must be array or distribution"
          );
        }
      }
      return vDist(unpackDistResult(getMixture()));
    });
  }),
];

// impossible to implement with FR due to arbitrary parameters length
// export const mxLambda = new BuiltinLambda("mx", [], (inputs, context) => {
//   return vDist(unpackDistResult(mixture(inputs, context.environment)));
// });

export const mxLambda = new BuiltinLambda("mx", defs);
