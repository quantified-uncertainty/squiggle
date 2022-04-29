import * as _ from "lodash";
import {
  genericDist,
  continuousShape,
  discreteShape,
  samplingParams,
  distributionError,
  toPointSet,
  distributionErrorToString,
} from "../rescript/TypescriptInterface.gen";
import { result, resultMap, Ok } from "./types";
import {
  Constructors_mean,
  Constructors_sample,
  Constructors_pdf,
  Constructors_cdf,
  Constructors_inv,
  Constructors_normalize,
  Constructors_isNormalized,
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

export type point = { x: number; y: number };

function shapePoints(x: continuousShape | discreteShape): point[] {
  let xs = x.xyShape.xs;
  let ys = x.xyShape.ys;
  return _.zipWith(xs, ys, (x, y) => ({ x, y }));
}
export type shape = {
  continuous: point[];
  discrete: point[];
};

export class Distribution {
  t: genericDist;
  env: samplingParams;

  constructor(t: genericDist, env: samplingParams) {
    this.t = t;
    this.env = env;
    return this;
  }

  mapResultDist(
    r: result<genericDist, distributionError>
  ): result<Distribution, distributionError> {
    return resultMap(r, (v: genericDist) => new Distribution(v, this.env));
  }

  mean(): result<number, distributionError> {
    return Constructors_mean({ env: this.env }, this.t);
  }

  sample(): result<number, distributionError> {
    return Constructors_sample({ env: this.env }, this.t);
  }

  pdf(n: number): result<number, distributionError> {
    return Constructors_pdf({ env: this.env }, this.t, n);
  }

  cdf(n: number): result<number, distributionError> {
    return Constructors_cdf({ env: this.env }, this.t, n);
  }

  inv(n: number): result<number, distributionError> {
    return Constructors_inv({ env: this.env }, this.t, n);
  }

  isNormalized(): result<boolean, distributionError> {
    return Constructors_isNormalized({ env: this.env }, this.t);
  }

  normalize(): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_normalize({ env: this.env }, this.t)
    );
  }

  type() {
    return this.t.tag;
  }

  pointSet(): result<shape, distributionError> {
    let pointSet = toPointSet(
      this.t,
      {
        xyPointLength: this.env.xyPointLength,
        sampleCount: this.env.sampleCount,
      },
      undefined
    );
    if (pointSet.tag === "Ok") {
      let distribution = pointSet.value;
      if (distribution.tag === "Continuous") {
        return Ok({
          continuous: shapePoints(distribution.value),
          discrete: [],
        });
      } else if (distribution.tag === "Discrete") {
        return Ok({
          discrete: shapePoints(distribution.value),
          continuous: [],
        });
      } else {
        return Ok({
          discrete: shapePoints(distribution.value.discrete),
          continuous: shapePoints(distribution.value.continuous),
        });
      }
    } else {
      return pointSet;
    }
  }

  toPointSet(): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_toPointSet({ env: this.env }, this.t)
    );
  }

  toSampleSet(n: number): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_toSampleSet({ env: this.env }, this.t, n)
    );
  }

  truncate(
    left: number,
    right: number
  ): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_truncate({ env: this.env }, this.t, left, right)
    );
  }

  inspect(): result<Distribution, distributionError> {
    return this.mapResultDist(Constructors_inspect({ env: this.env }, this.t));
  }

  toString(): string {
    let result = Constructors_toString({ env: this.env }, this.t);
    if (result.tag === "Ok") {
      return result.value;
    } else {
      return distributionErrorToString(result.value);
    }
  }

  toSparkline(n: number): result<string, distributionError> {
    return Constructors_toSparkline({ env: this.env }, this.t, n);
  }

  algebraicAdd(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_algebraicAdd({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicMultiply(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_algebraicMultiply({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicDivide(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_algebraicDivide({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicSubtract(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_algebraicSubtract({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicLogarithm(
    d2: Distribution
  ): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_algebraicLogarithm({ env: this.env }, this.t, d2.t)
    );
  }

  algebraicPower(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_algebraicPower({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseAdd(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_pointwiseAdd({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseMultiply(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_pointwiseMultiply({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseDivide(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_pointwiseDivide({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseSubtract(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_pointwiseSubtract({ env: this.env }, this.t, d2.t)
    );
  }

  pointwiseLogarithm(
    d2: Distribution
  ): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_pointwiseLogarithm({ env: this.env }, this.t, d2.t)
    );
  }

  pointwisePower(d2: Distribution): result<Distribution, distributionError> {
    return this.mapResultDist(
      Constructors_pointwisePower({ env: this.env }, this.t, d2.t)
    );
  }
}
