import * as _ from "lodash";
import {
  genericDist,
  samplingParams,
  environment,
  evaluatePartialUsingExternalBindings,
  evaluateUsingOptions,
  externalBindings,
  expressionValue,
  recordEV,
  errorValue,
  distributionError,
  toPointSet,
  continuousShape,
  discreteShape,
  distributionErrorToString,
  internalCode,
  mixedShape,
  sampleSetDist,
  symbolicDist,
  defaultEnvironment,
  defaultSamplingEnv,
} from "../rescript/TypescriptInterface.gen";
export {
  makeSampleSetDist,
  errorValueToString,
  distributionErrorToString,
} from "../rescript/TypescriptInterface.gen";
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
export type { samplingParams, errorValue, externalBindings as bindings };

export let defaultSamplingInputs: samplingParams = defaultSamplingEnv;

export type result<a, b> =
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

function Ok<a, b>(x: a): result<a, b> {
  return { tag: "Ok", value: x };
}

type tagged<a, b> = { tag: a; value: b };

function tag<a, b>(x: a, y: b): tagged<a, b> {
  return { tag: x, value: y };
}

export type squiggleExpression =
  | tagged<"symbol", string>
  | tagged<"string", string>
  | tagged<"call", string>
  | tagged<"lambda", [string[], recordEV, internalCode]>
  | tagged<"array", squiggleExpression[]>
  | tagged<"arrayString", string[]>
  | tagged<"boolean", boolean>
  | tagged<"distribution", Distribution>
  | tagged<"number", number>
  | tagged<"record", { [key: string]: squiggleExpression }>;

export function run(
  squiggleString: string,
  bindings?: externalBindings,
  samplingInputs?: samplingParams,
  environ?: environment
): result<squiggleExpression, errorValue> {
  let b = bindings ? bindings : {};
  let si: samplingParams = samplingInputs
    ? samplingInputs
    : defaultSamplingInputs;
  let e = environ ? environ : defaultEnvironment;
  let res: result<expressionValue, errorValue> = evaluateUsingOptions(
    { externalBindings: b, environment: e },
    squiggleString
  ); // , b, e);
  return resultMap(res, (x) => createTsExport(x, si));
}

// Run Partial. A partial is a block of code that doesn't return a value
export function runPartial(
  squiggleString: string,
  bindings: externalBindings,
  _samplingInputs?: samplingParams
): result<externalBindings, errorValue> {
  return evaluatePartialUsingExternalBindings(
    squiggleString,
    bindings,
    defaultEnvironment
  );
}

function createTsExport(
  x: expressionValue,
  sampEnv: samplingParams
): squiggleExpression {
  switch (x.tag) {
    case "EvArray":
      // genType doesn't convert anything more than 2 layers down into {tag: x, value: x}
      // format, leaving it as the raw values. This converts the raw values
      // directly into typescript values.
      //
      // The casting here is because genType is about the types of the returned
      // values, claiming they are fully recursive when that's not actually the
      // case
      return tag(
        "array",
        x.value.map((arrayItem): squiggleExpression => {
          switch (arrayItem.tag) {
            case "EvRecord":
              return tag(
                "record",
                _.mapValues(arrayItem.value, (recordValue: unknown) =>
                  convertRawToTypescript(recordValue as rescriptExport, sampEnv)
                )
              );
            case "EvArray":
              let y = arrayItem.value as unknown as rescriptExport[];
              return tag(
                "array",
                y.map((childArrayItem) =>
                  convertRawToTypescript(childArrayItem, sampEnv)
                )
              );
            default:
              return createTsExport(arrayItem, sampEnv);
          }
        })
      );
    case "EvArrayString":
      return tag("arrayString", x.value);
    case "EvBool":
      return tag("boolean", x.value);
    case "EvCall":
      return tag("call", x.value);
    case "EvLambda":
      return tag("lambda", x.value);
    case "EvDistribution":
      return tag("distribution", new Distribution(x.value, sampEnv));
    case "EvNumber":
      return tag("number", x.value);
    case "EvRecord":
      // genType doesn't support records, so we have to do the raw conversion ourself
      let result: tagged<"record", { [key: string]: squiggleExpression }> = tag(
        "record",
        _.mapValues(x.value, (x: unknown) =>
          convertRawToTypescript(x as rescriptExport, sampEnv)
        )
      );
      return result;
    case "EvString":
      return tag("string", x.value);
    case "EvSymbol":
      return tag("symbol", x.value);
  }
}

// Helper functions to convert the rescript representations that genType doesn't
// cover
function convertRawToTypescript(
  result: rescriptExport,
  sampEnv: samplingParams
): squiggleExpression {
  switch (result.TAG) {
    case 0: // EvArray
      return tag(
        "array",
        result._0.map((x) => convertRawToTypescript(x, sampEnv))
      );
    case 1: // EvBool
      return tag("boolean", result._0);
    case 2: // EvCall
      return tag("call", result._0);
    case 3: // EvDistribution
      return tag(
        "distribution",
        new Distribution(
          convertRawDistributionToGenericDist(result._0),
          sampEnv
        )
      );
    case 4: // EvNumber
      return tag("number", result._0);
    case 5: // EvRecord
      return tag(
        "record",
        _.mapValues(result._0, (x) => convertRawToTypescript(x, sampEnv))
      );
    case 6: // EvString
      return tag("string", result._0);
    case 7: // EvSymbol
      return tag("symbol", result._0);
  }
}

function convertRawDistributionToGenericDist(
  result: rescriptDist
): genericDist {
  switch (result.TAG) {
    case 0: // Point Set Dist
      switch (result._0.TAG) {
        case 0: // Mixed
          return tag("PointSet", tag("Mixed", result._0._0));
        case 1: // Discrete
          return tag("PointSet", tag("Discrete", result._0._0));
        case 2: // Continuous
          return tag("PointSet", tag("Continuous", result._0._0));
      }
    case 1: // Sample Set Dist
      return tag("SampleSet", result._0);
    case 2: // Symbolic Dist
      return tag("Symbolic", result._0);
  }
}

// Raw rescript types.
type rescriptExport =
  | {
      TAG: 0; // EvArray
      _0: rescriptExport[];
    }
  | {
      TAG: 1; // EvBool
      _0: boolean;
    }
  | {
      TAG: 2; // EvCall
      _0: string;
    }
  | {
      TAG: 3; // EvDistribution
      _0: rescriptDist;
    }
  | {
      TAG: 4; // EvNumber
      _0: number;
    }
  | {
      TAG: 5; // EvRecord
      _0: { [key: string]: rescriptExport };
    }
  | {
      TAG: 6; // EvString
      _0: string;
    }
  | {
      TAG: 7; // EvSymbol
      _0: string;
    };

type rescriptDist =
  | { TAG: 0; _0: rescriptPointSetDist }
  | { TAG: 1; _0: sampleSetDist }
  | { TAG: 2; _0: symbolicDist };

type rescriptPointSetDist =
  | {
      TAG: 0; // Mixed
      _0: mixedShape;
    }
  | {
      TAG: 1; // Discrete
      _0: discreteShape;
    }
  | {
      TAG: 2; // ContinuousShape
      _0: continuousShape;
    };

export function resultExn<a, c>(r: result<a, c>): a | c {
  return r.value;
}

export type point = { x: number; y: number };

export type shape = {
  continuous: point[];
  discrete: point[];
};

function shapePoints(x: continuousShape | discreteShape): point[] {
  let xs = x.xyShape.xs;
  let ys = x.xyShape.ys;
  return _.zipWith(xs, ys, (x, y) => ({ x, y }));
}

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
