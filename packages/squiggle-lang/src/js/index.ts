import { runAll } from "../rescript/ProgramEvaluator.gen";
import type {
  Inputs_SamplingInputs_t as SamplingInputs,
  exportEnv,
  exportType,
  exportDistribution,
} from "../rescript/ProgramEvaluator.gen";
export type { SamplingInputs, exportEnv, exportDistribution };
export type { t as DistPlus } from "../rescript/OldInterpreter/DistPlus.gen";
import { genericDist, env, error } from "../rescript/TypescriptInterface.gen";
export { makeSampleSetDist } from "../rescript/TypescriptInterface.gen";
import {
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
  Constructors_algebraicPower,
  Constructors_pointwiseAdd,
  Constructors_pointwiseMultiply,
  Constructors_pointwiseDivide,
  Constructors_pointwiseSubtract,
  Constructors_pointwiseLogarithm,
  Constructors_pointwisePower,
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
): result<exportType, string> {
  let si: SamplingInputs = samplingInputs
    ? samplingInputs
    : defaultSamplingInputs;
  let env: exportEnv = environment ? environment : [];
  return runAll(squiggleString, si, env);
}

type result<a, b> =
  | {
      tag: "Ok";
      value: a;
    }
  | {
      tag: "Error";
      value: b;
    };

export function resultMap<a, b, c>(
  r: result<a, c>,
  mapFn: (x: a) => b
): result<b, c> {
  if (r.tag === "Ok") {
    return { tag: "Ok", value: mapFn(r.value) };
  } else {
    return r;
  }
}

export function resultExn<a, c>(r: result<a, c>): a | c {
  return r.value;
}

export class Distribution {
  t: genericDist;
  env: env;

  constructor(t: genericDist, env: env) {
    this.t = t;
    this.env = env;
    return this;
  }

  mapResultDist(r: result<genericDist, error>): result<Distribution, error> {
    return resultMap(r, (v: genericDist) => new Distribution(v, this.env));
  }

  mean(): result<number, error> {
    return Constructors_mean({ env: this.env }, this.t);
  }

  sample(): result<number, error> {
    return Constructors_sample({ env: this.env }, this.t);
  }

  pdf(n: number): result<number, error> {
    return Constructors_pdf({ env: this.env }, this.t, n);
  }

  cdf(n: number): result<number, error> {
    return Constructors_cdf({ env: this.env }, this.t, n);
  }

  inv(n: number): result<number, error> {
    return Constructors_inv({ env: this.env }, this.t, n);
  }

  normalize(): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_normalize({ env: this.env }, this.t)
    );
  }

  toPointSet(): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_toPointSet({ env: this.env }, this.t)
    );
  }

  toSampleSet(n: number): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_toSampleSet({ env: this.env }, this.t, n)
    );
  }

  truncate(left: number, right: number): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_truncate({ env: this.env }, this.t, left, right)
    );
  }

  inspect(): result<Distribution, error> {
    return this.mapResultDist(Constructors_inspect({ env: this.env }, this.t));
  }

  toString(): result<string, error> {
    return Constructors_toString({ env: this.env }, this.t);
  }

  toSparkline(n: number): result<string, error> {
    return Constructors_toSparkline({ env: this.env }, this.t, n);
  }

  algebraicAdd(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_algebraicAdd({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicMultiply(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_algebraicMultiply({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicDivide(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_algebraicDivide({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicSubtract(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_algebraicSubtract({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicLogarithm(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_algebraicLogarithm({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicPower(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_algebraicPower({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseAdd(d2: Distribution) {
    return this.mapResultDist(
      Constructors_pointwiseAdd({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseMultiply(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_pointwiseMultiply({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseDivide(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_pointwiseDivide({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseSubtract(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_pointwiseSubtract({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseLogarithm(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_pointwiseLogarithm({ env: this.env }, this.t, d2.t)
    );
  }

  pointwisePower(d2: Distribution): result<Distribution, error> {
    return this.mapResultDist(
      Constructors_pointwisePower({ env: this.env }, this.t, d2.t)
    );
  }
}
