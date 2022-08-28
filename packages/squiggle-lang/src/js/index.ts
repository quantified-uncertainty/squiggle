import { environment } from "../rescript/ForTS/ForTS_ReducerProject.gen";
import { SqProject } from "./SqProject";
import { SqValue, SqValueTag } from "./SqValue";
export { result } from "../rescript/ForTS/ForTS_Result_tag";
export { SqDistribution, SqDistributionTag } from "./SqDistribution";
export { SqDistributionError } from "./SqDistributionError";
export { SqRecord } from "./SqRecord";
export { SqLambda } from "./SqLambda";
export { SqProject };
export { SqValue, SqValueTag };
export {
  environment,
  defaultEnvironment,
} from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution.gen";
export { SqError } from "./SqError";
export { SqShape } from "./SqPointSetDist";

export { resultMap } from "./types";

export const run = (
  code: string,
  options?: {
    environment?: environment;
  }
) => {
  const project = SqProject.create();
  project.setSource("main", code);
  if (options?.environment) {
    project.setEnvironment(options.environment);
  }
  project.run("main");
  const result = project.getResult("main");
  const bindings = project.getBindings("main");
  return { result, bindings };
};

// import {
//   jsValueToBinding,
//   jsValueToExpressionValue,
//   jsValue,
//   rescriptExport,
//   squiggleExpression,
//   convertRawToTypescript,
//   lambdaValue,
// } from "./rescript_interop";

// export function runForeign(
//   fn: lambdaValue,
//   args: jsValue[],
//   environment?: environment
// ): result<squiggleExpression, errorValue> {
//   let e = environment ? environment : defaultEnvironment;
//   let res: result<expressionValue, errorValue> = foreignFunctionInterface(
//     fn,
//     args.map(jsValueToExpressionValue),
//     e
//   );
//   return resultMap(res, (x) => createTsExport(x, e));
// }

// function mergeImportsWithBindings(
//   bindings: externalBindings,
//   imports: jsImports
// ): externalBindings {
//   let transformedImports = Object.fromEntries(
//     Object.entries(imports).map(([key, value]) => [
//       "$" + key,
//       jsValueToBinding(value),
//     ])
//   );
//   return _.merge(bindings, transformedImports);
// }

// type jsImports = { [key: string]: jsValue };

// export let defaultImports: jsImports = {};
// export let defaultBindings: externalBindings = {};

// export function mergeBindings(
//   allBindings: externalBindings[]
// ): externalBindings {
//   return allBindings.reduce((acc, x) => ({ ...acc, ...x }));
// }

// function createTsExport(
//   x: expressionValue,
//   environment: environment
// ): squiggleExpression {
//   switch (x) {
//     case "EvVoid":
//       return tag("void", "");
//     default: {
//       switch (x.tag) {
//         case "EvArray":
//           // genType doesn't convert anything more than 2 layers down into {tag: x, value: x}
//           // format, leaving it as the raw values. This converts the raw values
//           // directly into typescript values.
//           //
//           // The casting here is because genType is about the types of the returned
//           // values, claiming they are fully recursive when that's not actually the
//           // case
//           return tag(
//             "array",
//             x.value.map(
//               (arrayItem): squiggleExpression =>
//                 convertRawToTypescript(
//                   arrayItem as unknown as rescriptExport,
//                   environment
//                 )
//             )
//           );
//         case "EvArrayString":
//           return tag("arraystring", x.value);
//         case "EvBool":
//           return tag("boolean", x.value);
//         case "EvCall":
//           return tag("call", x.value);
//         case "EvLambda":
//           return tag("lambda", x.value);
//         case "EvDistribution":
//           return tag("distribution", new Distribution(x.value, environment));
//         case "EvNumber":
//           return tag("number", x.value);
//         case "EvRecord":
//           // genType doesn't support records, so we have to do the raw conversion ourself
//           let result: tagged<"record", { [key: string]: squiggleExpression }> =
//             tag(
//               "record",
//               _.mapValues(x.value, (x: unknown) =>
//                 convertRawToTypescript(x as rescriptExport, environment)
//               )
//             );
//           return result;
//         case "EvString":
//           return tag("string", x.value);
//         case "EvSymbol":
//           return tag("symbol", x.value);
//         case "EvDate":
//           return tag("date", x.value);
//         case "EvTimeDuration":
//           return tag("timeDuration", x.value);
//         case "EvDeclaration":
//           return tag("lambdaDeclaration", x.value);
//         case "EvTypeIdentifier":
//           return tag("typeIdentifier", x.value);
//         case "EvType":
//           let typeResult: tagged<
//             "type",
//             { [key: string]: squiggleExpression }
//           > = tag(
//             "type",
//             _.mapValues(x.value, (x: unknown) =>
//               convertRawToTypescript(x as rescriptExport, environment)
//             )
//           );
//           return typeResult;
//         case "EvModule":
//           let moduleResult: tagged<
//             "module",
//             { [key: string]: squiggleExpression }
//           > = tag(
//             "module",
//             _.mapValues(x.value, (x: unknown) =>
//               convertRawToTypescript(x as rescriptExport, environment)
//             )
//           );
//           return moduleResult;
//       }
//     }
//   }
// }
