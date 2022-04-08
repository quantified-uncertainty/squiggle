import { runAll } from "../rescript/ProgramEvaluator.gen";
import type {
  Inputs_SamplingInputs_t as SamplingInputs,
  exportEnv,
  exportType,
  exportDistribution,
} from "../rescript/ProgramEvaluator.gen";
export type { SamplingInputs, exportEnv, exportDistribution };
export type { t as DistPlus } from "../rescript/OldInterpreter/DistPlus.gen";
import {
  genericDist,
  resultDist,
  resultFloat,
  resultString,
} from "../rescript/TSInterface.gen";
import {
  env,
  Constructors_mean,
  Constructors_sample,
  Constructors_pdf,
  Constructors_cdf,
  Constructors_inv,
  Constructors_normalize,
  Constructors_toPointSet,
  Constructors_toSampleSet,
  Constructors_truncate,
  Constructors_inspect,
  Constructors_toString,
  Constructors_toSparkline,
  Constructors_algebraicAdd,
  Constructors_algebraicMultiply,
  Constructors_algebraicDivide,
  Constructors_algebraicSubtract,
  Constructors_algebraicLogarithm,
  Constructors_algebraicExponentiate,
  Constructors_pointwiseAdd,
  Constructors_pointwiseMultiply,
  Constructors_pointwiseDivide,
  Constructors_pointwiseSubtract,
  Constructors_pointwiseLogarithm,
  Constructors_pointwiseExponentiate,
} from "../rescript/Distributions/DistributionOperation/DistributionOperation.gen";

export let defaultSamplingInputs: SamplingInputs = {
  sampleCount: 10000,
  outputXYPoints: 10000,
  pointDistLength: 1000,
};

export function run(
  squiggleString: string,
  samplingInputs?: SamplingInputs,
  environment?: exportEnv
): { tag: "Ok"; value: exportType } | { tag: "Error"; value: string } {
  let si: SamplingInputs = samplingInputs
    ? samplingInputs
    : defaultSamplingInputs;
  let env: exportEnv = environment ? environment : [];
  return runAll(squiggleString, si, env);
}

export function resultMap(
  r:
    | {
        tag: "Ok";
        value: any;
      }
    | {
        tag: "Error";
        value: any;
      },
  mapFn: any
):
  | {
      tag: "Ok";
      value: any;
    }
  | {
      tag: "Error";
      value: any;
    } {
  if (r.tag === "Ok") {
    return { tag: "Ok", value: mapFn(r.value) };
  } else {
    return r;
  }
}

export class GenericDist {
  t: genericDist;
  env: env;

  constructor(t: genericDist, env: env) {
    this.t = t;
    this.env = env;
    return this;
  }

  mapResultDist(r: resultDist) {
    return resultMap(r, (v: genericDist) => new GenericDist(v, this.env));
  }

  mean() {
    return Constructors_mean({ env: this.env }, this.t);
  }

  sample(): resultFloat {
    return Constructors_sample({ env: this.env }, this.t);
  }

  pdf(n: number): resultFloat {
    return Constructors_pdf({ env: this.env }, this.t, n);
  }

  cdf(n: number): resultFloat {
    return Constructors_cdf({ env: this.env }, this.t, n);
  }

  inv(n: number): resultFloat {
    return Constructors_inv({ env: this.env }, this.t, n);
  }

  normalize() {
    return this.mapResultDist(
      Constructors_normalize({ env: this.env }, this.t)
    );
  }

  toPointSet() {
    return this.mapResultDist(
      Constructors_toPointSet({ env: this.env }, this.t)
    );
  }

  toSampleSet(n: number) {
    return this.mapResultDist(
      Constructors_toSampleSet({ env: this.env }, this.t, n)
    );
  }

  truncate(left: number, right: number) {
    return this.mapResultDist(
      Constructors_truncate({ env: this.env }, this.t, left, right)
    );
  }

  inspect() {
    return this.mapResultDist(Constructors_inspect({ env: this.env }, this.t));
  }

  toString(): resultString {
    return Constructors_toString({ env: this.env }, this.t);
  }

  toSparkline(n: number): resultString {
    return Constructors_toSparkline({ env: this.env }, this.t, n);
  }

  algebraicAdd(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_algebraicAdd({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicMultiply(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_algebraicMultiply({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicDivide(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_algebraicDivide({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicSubtract(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_algebraicSubtract({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicLogarithm(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_algebraicLogarithm({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicExponentiate(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_algebraicExponentiate({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseAdd(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_pointwiseAdd({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseMultiply(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_pointwiseMultiply({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseDivide(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_pointwiseDivide({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseSubtract(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_pointwiseSubtract({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseLogarithm(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_pointwiseLogarithm({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseExponentiate(d2: GenericDist) {
    return this.mapResultDist(
      Constructors_pointwiseExponentiate({ env: this.env }, this.t, d2.t)
    );
  }
}
