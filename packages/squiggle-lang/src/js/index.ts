import * as _ from "lodash";
import type {
  environment,
  expressionValue,
  externalBindings,
  errorValue,
} from "../rescript/TypescriptInterface.gen";
import {
  defaultEnvironment,
  evaluatePartialUsingExternalBindings,
  evaluateUsingOptions,
  foreignFunctionInterface,
} from "../rescript/TypescriptInterface.gen";
export {
  makeSampleSetDist,
  errorValueToString,
  distributionErrorToString,
} from "../rescript/TypescriptInterface.gen";
export type {
  distributionError,
  declarationArg,
  declaration,
} from "../rescript/TypescriptInterface.gen";
export type { errorValue, externalBindings as bindings, jsImports };
import {
  jsValueToBinding,
  jsValueToExpressionValue,
  jsValue,
  rescriptExport,
  squiggleExpression,
  convertRawToTypescript,
  lambdaValue,
} from "./rescript_interop";
import { result, resultMap, tag, tagged } from "./types";
import { Distribution, shape } from "./distribution";

export { Distribution, resultMap, defaultEnvironment };
export type { result, shape, environment, lambdaValue, squiggleExpression };

export { parse } from "./parse";

export let defaultSamplingInputs: environment = {
  sampleCount: 10000,
  xyPointLength: 10000,
};

export function run(
  squiggleString: string,
  bindings?: externalBindings,
  environment?: environment,
  imports?: jsImports
): result<squiggleExpression, errorValue> {
  let b = bindings ? bindings : defaultBindings;
  let i = imports ? imports : defaultImports;
  let e = environment ? environment : defaultEnvironment;
  let res: result<expressionValue, errorValue> = evaluateUsingOptions(
    { externalBindings: mergeImportsWithBindings(b, i), environment: e },
    squiggleString
  );
  return resultMap(res, (x) => createTsExport(x, e));
}

// Run Partial. A partial is a block of code that doesn't return a value
export function runPartial(
  squiggleString: string,
  bindings?: externalBindings,
  environment?: environment,
  imports?: jsImports
): result<externalBindings, errorValue> {
  let b = bindings ? bindings : defaultBindings;
  let i = imports ? imports : defaultImports;
  let e = environment ? environment : defaultEnvironment;

  return evaluatePartialUsingExternalBindings(
    squiggleString,
    mergeImportsWithBindings(b, i),
    e
  );
}

export function runForeign(
  fn: lambdaValue,
  args: jsValue[],
  environment?: environment
): result<squiggleExpression, errorValue> {
  let e = environment ? environment : defaultEnvironment;
  let res: result<expressionValue, errorValue> = foreignFunctionInterface(
    fn,
    args.map(jsValueToExpressionValue),
    e
  );
  return resultMap(res, (x) => createTsExport(x, e));
}

function mergeImportsWithBindings(
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

export function mergeBindings(
  allBindings: externalBindings[]
): externalBindings {
  return allBindings.reduce((acc, x) => ({ ...acc, ...x }));
}

function createTsExport(
  x: expressionValue,
  environment: environment
): squiggleExpression {
  switch (x) {
    case "EvVoid":
      return tag("void", "");
    default: {
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
            x.value.map(
              (arrayItem): squiggleExpression =>
                convertRawToTypescript(
                  arrayItem as unknown as rescriptExport,
                  environment
                )
            )
          );
        case "EvArrayString":
          return tag("arraystring", x.value);
        case "EvBool":
          return tag("boolean", x.value);
        case "EvCall":
          return tag("call", x.value);
        case "EvLambda":
          return tag("lambda", x.value);
        case "EvDistribution":
          return tag("distribution", new Distribution(x.value, environment));
        case "EvNumber":
          return tag("number", x.value);
        case "EvRecord":
          // genType doesn't support records, so we have to do the raw conversion ourself
          let result: tagged<"record", { [key: string]: squiggleExpression }> =
            tag(
              "record",
              _.mapValues(x.value, (x: unknown) =>
                convertRawToTypescript(x as rescriptExport, environment)
              )
            );
          return result;
        case "EvString":
          return tag("string", x.value);
        case "EvSymbol":
          return tag("symbol", x.value);
        case "EvDate":
          return tag("date", x.value);
        case "EvTimeDuration":
          return tag("timeDuration", x.value);
        case "EvDeclaration":
          return tag("lambdaDeclaration", x.value);
        case "EvTypeIdentifier":
          return tag("typeIdentifier", x.value);
        case "EvType":
          let typeResult: tagged<
            "type",
            { [key: string]: squiggleExpression }
          > = tag(
            "type",
            _.mapValues(x.value, (x: unknown) =>
              convertRawToTypescript(x as rescriptExport, environment)
            )
          );
          return typeResult;
        case "EvModule":
          let moduleResult: tagged<
            "module",
            { [key: string]: squiggleExpression }
          > = tag(
            "module",
            _.mapValues(x.value, (x: unknown) =>
              convertRawToTypescript(x as rescriptExport, environment)
            )
          );
          return moduleResult;
      }
    }
  }
}
