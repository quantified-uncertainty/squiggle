import { runAll } from "../rescript/ProgramEvaluator.gen";
import type {
  Inputs_SamplingInputs_t as SamplingInputs,
  exportEnv,
  exportType,
  exportDistribution,
} from "../rescript/ProgramEvaluator.gen";
export type { SamplingInputs, exportEnv, exportDistribution };
export type { t as DistPlus } from "../rescript/OldInterpreter/DistPlus.gen";
import type { Operation_genericFunctionCallInfo } from "../rescript/Distributions/GenericDist/GenericDist_Types.gen";
import {
  genericDist,
  resultDist,
  resultFloat,
  resultString,
} from "../rescript/TSInterface.gen";
import {
  env,
  Constructors_UsingDists_mean,
  Constructors_UsingDists_sample,
  Constructors_UsingDists_pdf,
  Constructors_UsingDists_cdf,
  Constructors_UsingDists_inv,
  Constructors_UsingDists_normalize,
  Constructors_UsingDists_toPointSet,
  Constructors_UsingDists_toSampleSet,
  Constructors_UsingDists_truncate,
  Constructors_UsingDists_inspect,
  Constructors_UsingDists_toString,
  Constructors_UsingDists_toSparkline,
  Constructors_UsingDists_algebraicAdd,
  Constructors_UsingDists_algebraicMultiply,
  Constructors_UsingDists_algebraicDivide,
  Constructors_UsingDists_algebraicSubtract,
  Constructors_UsingDists_algebraicLogarithm,
  Constructors_UsingDists_algebraicExponentiate,
  Constructors_UsingDists_pointwiseAdd,
  Constructors_UsingDists_pointwiseMultiply,
  Constructors_UsingDists_pointwiseDivide,
  Constructors_UsingDists_pointwiseSubtract,
  Constructors_UsingDists_pointwiseLogarithm,
  Constructors_UsingDists_pointwiseExponentiate,
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

class GenericDist {
  t: genericDist;
  env: env;

  constructor(t: genericDist, env: env) {
    this.t = t;
  }

  mean(): resultFloat {
    return Constructors_UsingDists_mean({ env: this.env }, this.t);
  }

  sample(): resultFloat {
    return Constructors_UsingDists_sample({ env: this.env }, this.t);
  }

  pdf(n: number): resultFloat {
    return Constructors_UsingDists_pdf({ env: this.env }, this.t, n);
  }

  cdf(n: number): resultFloat {
    return Constructors_UsingDists_cdf({ env: this.env }, this.t, n);
  }

  inv(n: number): resultFloat {
    return Constructors_UsingDists_inv({ env: this.env }, this.t, n);
  }

  normalize(): resultDist {
    return Constructors_UsingDists_normalize({ env: this.env }, this.t);
  }

  toPointSet(): resultDist {
    return Constructors_UsingDists_toPointSet({ env: this.env }, this.t);
  }

  toSampleSet(n: number): resultDist {
    return Constructors_UsingDists_toSampleSet({ env: this.env }, this.t, n);
  }

  truncate(left: number, right: number): resultDist {
    return Constructors_UsingDists_truncate(
      { env: this.env },
      this.t,
      left,
      right
    );
  }

  inspect(): resultDist {
    return Constructors_UsingDists_inspect({ env: this.env }, this.t);
  }

  toString(): resultString {
    return Constructors_UsingDists_toString({ env: this.env }, this.t);
  }

  toSparkline(n: number): resultString {
    return Constructors_UsingDists_toSparkline({ env: this.env }, this.t, n);
  }

  algebraicAdd(d2: GenericDist): resultDist {
    return Constructors_UsingDists_algebraicAdd(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  algebraicMultiply(d2: GenericDist): resultDist {
    return Constructors_UsingDists_algebraicMultiply(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  algebraicDivide(d2: GenericDist): resultDist {
    return Constructors_UsingDists_algebraicDivide(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  algebraicSubtract(d2: GenericDist): resultDist {
    return Constructors_UsingDists_algebraicSubtract(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  algebraicLogarithm(d2: GenericDist): resultDist {
    return Constructors_UsingDists_algebraicLogarithm(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  algebraicExponentiate(d2: GenericDist): resultDist {
    return Constructors_UsingDists_algebraicExponentiate(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  pointwiseAdd(d2: GenericDist): resultDist {
    return Constructors_UsingDists_pointwiseAdd(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  pointwiseMultiply(d2: GenericDist): resultDist {
    return Constructors_UsingDists_pointwiseMultiply(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  pointwiseDivide(d2: GenericDist): resultDist {
    return Constructors_UsingDists_pointwiseDivide(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  pointwiseSubtract(d2: GenericDist): resultDist {
    return Constructors_UsingDists_pointwiseSubtract(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  pointwiseLogarithm(d2: GenericDist): resultDist {
    return Constructors_UsingDists_pointwiseLogarithm(
      { env: this.env },
      this.t,
      d2.t
    );
  }

  pointwiseExponentiate(d2: GenericDist): resultDist {
    return Constructors_UsingDists_pointwiseExponentiate(
      { env: this.env },
      this.t,
      d2.t
    );
  }
}
