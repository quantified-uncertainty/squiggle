import { BaseDist } from "../Dist/BaseDist";
import { Env } from "../Dist/env";
import * as SymbolicDist from "../Dist/SymbolicDist";
import * as Lambda from "../reducer/lambda";
import * as IError from "../reducer/IError";
import * as RSResult from "../rsResult";
import * as E_A from "../utility/E_A";
import * as DistOperations from "../Dist/DistOperations";
import { Value, vDist } from "../value";
import { argumentError, DistError } from "../Dist/DistError";
import { unpackDistResult } from "../library/registry/helpers";

const raiseArgumentError = (message: string) =>
  IError.Message.throw(IError.REDistributionError(argumentError(message)));

let parseNumber = (arg: Value): number => {
  if (arg.type === "Number") {
    return arg.value;
  } else {
    return raiseArgumentError("Not a number");
  }
};

const parseNumberArray = (args: Value[]): number[] => args.map(parseNumber);

const parseDist = (args: Value): BaseDist => {
  if (args.type === "Dist") {
    return args.value;
  } else if (args.type === "Number") {
    return new SymbolicDist.Float(args.value);
  } else {
    return raiseArgumentError("Not a distribution");
  }
};

let parseDistributionArray = (ags: Value[]): BaseDist[] => ags.map(parseDist);

let mixtureWithGivenWeights = (
  distributions: BaseDist[],
  weights: number[],
  env: Env
): RSResult.rsResult<BaseDist, DistError> => {
  if (distributions.length === weights.length) {
    return DistOperations.mixture(E_A.zip(distributions, weights), { env });
  } else {
    return raiseArgumentError(
      "Error, mixture call has different number of distributions and weights"
    );
  }
};

const mixtureWithDefaultWeights = (distributions: BaseDist[], env: Env) => {
  const length = distributions.length;
  const weights = new Array(length).fill(1 / length);
  return mixtureWithGivenWeights(distributions, weights, env);
};

const mixture = (args: Value[], env: Env) => {
  if (args.length === 1 && args[0].type === "Array") {
    return mixtureWithDefaultWeights(
      parseDistributionArray(args[0].value),
      env
    );
  } else if (
    args.length === 2 &&
    args[0].type === "Array" &&
    args[1].type === "Array"
  ) {
    const distributions = args[0].value;
    const weights = args[1].value;
    const distrs = parseDistributionArray(distributions);
    const wghts = parseNumberArray(weights);
    return mixtureWithGivenWeights(distrs, wghts, env);
  } else if (args.length > 0) {
    const last = args[args.length - 1];
    if (last.type === "Array") {
      const weights = parseNumberArray(last.value);
      const distributions = parseDistributionArray(
        args.slice(0, args.length - 1)
      );
      return mixtureWithGivenWeights(distributions, weights, env);
    } else if (last.type === "Number" || last.type === "Dist") {
      return mixtureWithDefaultWeights(parseDistributionArray(args), env);
    }
  }
  return raiseArgumentError(
    "Last argument of mx must be array or distribution"
  );
};

// impossible to implement with FR due to arbitrary parameters length
export const mxLambda = Lambda.makeFFILambda("mx", (inputs, context) => {
  return vDist(unpackDistResult(mixture(inputs, context.environment)));
});
