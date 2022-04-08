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
import { genericDist } from "../rescript/TSInterface.gen";
import {
  run as runR,
  env,
  outputType,
} from "../rescript/Distributions/DistributionOperation/DistributionOperation.gen";
import { add } from "lodash";

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

  mean(): outputType {
    return runR(
      { env: this.env },
      { tag: "FromDist", value: [{ tag: "ToFloat", value: "Mean" }, this.t] }
    );
  }

  pdf(n: number): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [{ tag: "ToFloat", value: { NAME: "Pdf", VAL: n } }, this.t],
      }
    );
  }

  cdf(n: number): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [{ tag: "ToFloat", value: { NAME: "Pdf", VAL: n } }, this.t],
      }
    );
  }

  inv(n: number): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [{ tag: "ToFloat", value: { NAME: "Pdf", VAL: n } }, this.t],
      }
    );
  }

  normalize(n: number): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [{ tag: "ToDist", value: "Normalize" }, this.t],
      }
    );
  }

  toPointSet(): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [{ tag: "ToDist", value: "ToPointSet" }, this.t],
      }
    );
  }

  inspect(): outputType {
    return runR(
      { env: this.env },
      { tag: "FromDist", value: [{ tag: "ToDist", value: "Inspect" }, this.t] }
    );
  }

  toSampleSet(n: number): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [
          { tag: "ToDist", value: { tag: "ToSampleSet", value: n } },
          this.t,
        ],
      }
    );
  }

  truncate(
    left: null | undefined | number,
    right: null | undefined | number
  ): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [
          { tag: "ToDist", value: { tag: "Truncate", value: [left, right] } },
          this.t,
        ],
      }
    );
  }

  toString(): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [{ tag: "ToString", value: "ToString" }, this.t],
      }
    );
  }

  toSparkline(n: number): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [
          { tag: "ToString", value: { tag: "ToSparkline", value: n } },
          this.t,
        ],
      }
    );
  }

  add(g2: genericDist): outputType {
    return runR(
      { env: this.env },
      {
        tag: "FromDist",
        value: [
          {
            tag: "ToDistCombination",
            value: [
              {
                tag: "ToDistCombination",
                value: ["Algebraic", "Add", { NAME: "Dist", VAL: g2 }],
              },
            ],
          },
          this.t,
        ],
      }
    );
  }
}
