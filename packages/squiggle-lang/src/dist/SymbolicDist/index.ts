import * as Operation from "../../operation.js";
import { OperationError } from "../../operationError.js";
import * as Result from "../../utility/result.js";
import { Ok, result } from "../../utility/result.js";
import { JsonValue } from "../../utility/typeHelpers.js";
import { BaseSymbolicDist } from "./BaseSymbolicDist.js";
import { Bernoulli } from "./Bernoulli.js";
import { Beta } from "./Beta.js";
import { Binomial } from "./Binomial.js";
import { Cauchy } from "./Cauchy.js";
import { Exponential } from "./Exponential.js";
import { Gamma } from "./Gamma.js";
import { Logistic } from "./Logistic.js";
import { Lognormal } from "./Lognormal.js";
import { Normal } from "./Normal.js";
import { PointMass } from "./PointMass.js";
import { Poisson } from "./Poisson.js";
import { Triangular } from "./Triangular.js";
import { Uniform } from "./Uniform.js";

export {
  Bernoulli,
  Beta,
  Binomial,
  Cauchy,
  Exponential,
  Gamma,
  Logistic,
  Lognormal,
  Normal,
  PointMass,
  Poisson,
  Triangular,
  Uniform,
};

/* Calling e.g. "Normal.operate" returns an optional Result.
   If the result is undefined, there is no valid analytic solution.
   If it's a Result object, it can still return an error if there is a serious problem,
   like in the case of a divide by 0.
*/
export const tryAnalyticalSimplification = (
  d1: SymbolicDist,
  d2: SymbolicDist,
  op: Operation.AlgebraicOperation
): result<SymbolicDist, OperationError> | undefined => {
  if (d1 instanceof PointMass && d2 instanceof PointMass) {
    return Result.fmap(
      Operation.Algebraic.toFn(op)(d1.t, d2.t),
      (v) => new PointMass(v)
    );
  } else if (d1 instanceof Normal && d2 instanceof Normal) {
    const out = Normal.operate(op, d1, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof PointMass && d2 instanceof Normal) {
    const out = Normal.operateFloatFirst(op, d1.t, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof Normal && d2 instanceof PointMass) {
    const out = Normal.operateFloatSecond(op, d1, d2.t);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof Lognormal && d2 instanceof Lognormal) {
    const out = Lognormal.operate(op, d1, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof PointMass && d2 instanceof Lognormal) {
    const out = Lognormal.operateFloatFirst(op, d1.t, d2);
    return out ? Ok(out) : undefined;
  } else if (d1 instanceof Lognormal && d2 instanceof PointMass) {
    const out = Lognormal.operateFloatSecond(op, d1, d2.t);
    return out ? Ok(out) : undefined;
  } else {
    return undefined; // no solution
  }
};

export type SymbolicDist = BaseSymbolicDist<string, JsonValue>;

type KnownSymbolicDist =
  | Normal
  | Lognormal
  | PointMass
  | Bernoulli
  | Beta
  | Binomial
  | Cauchy
  | Exponential
  | Gamma
  | Logistic
  | Poisson
  | Triangular
  | Uniform;

type GetArgs<V> = V extends BaseSymbolicDist<string, infer A> ? A : never;

export type SerializedSymbolicDist = {
  [T in KnownSymbolicDist["symbolicType"]]: {
    type: T;
    args: GetArgs<Extract<KnownSymbolicDist, { symbolicType: T }>>;
  };
}[KnownSymbolicDist["symbolicType"]];

export function assertIsKnownSymbolicDist(
  dist: SymbolicDist
): asserts dist is KnownSymbolicDist {
  if (
    !(
      dist instanceof Normal ||
      dist instanceof Lognormal ||
      dist instanceof PointMass ||
      dist instanceof Bernoulli ||
      dist instanceof Beta ||
      dist instanceof Binomial ||
      dist instanceof Cauchy ||
      dist instanceof Exponential ||
      dist instanceof Gamma ||
      dist instanceof Logistic ||
      dist instanceof Poisson ||
      dist instanceof Triangular ||
      dist instanceof Uniform
    )
  ) {
    throw new Error(`Unknown symbolic dist type ${dist.symbolicType}`);
  }
}

export function serializeSymbolicDist(
  dist: KnownSymbolicDist
): SerializedSymbolicDist {
  return {
    type: dist.symbolicType,
    args: dist.getArgs(),
  } as SerializedSymbolicDist;
}

export function deserializeSymbolicDist(
  value: SerializedSymbolicDist
): KnownSymbolicDist {
  const unpack = <T>(r: result<T, string>): T => {
    if (!r.ok) {
      throw new Error(r.value);
    }
    return r.value;
  };

  switch (value.type) {
    case "Normal":
      return unpack(Normal.make(value.args));
    case "Lognormal":
      return unpack(Lognormal.make(value.args));
    case "PointMass":
      return unpack(PointMass.make(value.args));
    case "Bernoulli":
      return unpack(Bernoulli.make(value.args));
    case "Beta":
      return unpack(Beta.make(value.args));
    case "Binomial":
      return unpack(Binomial.make(value.args));
    case "Cauchy":
      return unpack(Cauchy.make(value.args));
    case "Exponential":
      return unpack(Exponential.make(value.args));
    case "Gamma":
      return unpack(Gamma.make(value.args));
    case "Logistic":
      return unpack(Logistic.make(value.args));
    case "Poisson":
      return unpack(Poisson.make(value.args));
    case "Triangular":
      return unpack(Triangular.make(value.args));
    case "Uniform":
      return unpack(Uniform.make(value.args));
    default:
      throw new Error(`Unknown type ${value satisfies never}`);
  }
}
