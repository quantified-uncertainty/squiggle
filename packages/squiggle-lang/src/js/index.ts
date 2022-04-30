import * as _ from "lodash";
import {
  samplingParams,
  evaluateUsingExternalBindings,
  evaluatePartialUsingExternalBindings,
  externalBindings,
  expressionValue,
  errorValue,
} from "../rescript/TypescriptInterface.gen";
export {
  makeSampleSetDist,
  errorValueToString,
  distributionErrorToString,
  distributionError,
} from "../rescript/TypescriptInterface.gen";
export type {
  samplingParams,
  errorValue,
  externalBindings as bindings,
  jsImports,
};
import {
  jsValueToBinding,
  jsValue,
  rescriptExport,
  squiggleExpression,
  convertRawToTypescript,
} from "./rescript_interop";
import { result, resultMap, tag, tagged } from "./types";
import { Distribution } from "./distribution";

export { Distribution, squiggleExpression, result, resultMap };

export let defaultSamplingInputs: samplingParams = {
  sampleCount: 10000,
  xyPointLength: 10000,
};

export function run(
  squiggleString: string,
  bindings?: externalBindings,
  samplingInputs?: samplingParams,
  imports?: jsImports
): result<squiggleExpression, errorValue> {
  let b = bindings ? bindings : defaultBindings;
  let i = imports ? imports : defaultImports;
  let si: samplingParams = samplingInputs
    ? samplingInputs
    : defaultSamplingInputs;

  let result: result<expressionValue, errorValue> =
    evaluateUsingExternalBindings(squiggleString, mergeImports(b, i));
  return resultMap(result, (x) => createTsExport(x, si));
}

// Run Partial. A partial is a block of code that doesn't return a value
export function runPartial(
  squiggleString: string,
  bindings?: externalBindings,
  _samplingInputs?: samplingParams,
  imports?: jsImports
): result<externalBindings, errorValue> {
  let b = bindings ? bindings : defaultBindings;
  let i = imports ? imports : defaultImports;

  return evaluatePartialUsingExternalBindings(
    squiggleString,
    mergeImports(b, i)
  );
}

function mergeImports(
  bindings: externalBindings,
  imports: jsImports
): externalBindings {
  let transformedImports = Object.fromEntries(
    Object.entries(imports).map(([key, value]) => [
      "$" + key,
      jsValueToBinding(value),
    ])
  );
  return _.merge(bindings, transformedImports);
}

type jsImports = { [key: string]: jsValue };

export let defaultImports: jsImports = {};
export let defaultBindings: externalBindings = {};

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
    case "EvBool":
      return tag("boolean", x.value);
    case "EvCall":
      return tag("call", x.value);
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
