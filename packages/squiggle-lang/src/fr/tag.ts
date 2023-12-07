import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  FRType,
  FrOrType,
  frAny,
  frArray,
  frBoxed,
  frCalculator,
  frDictWithArbitraryKeys,
  frDist,
  frDistOrNumber,
  frGeneric,
  frLambda,
  frLambdaTyped,
  frNumber,
  frOr,
  frPlot,
  frString,
  frTableChart,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, boxedArgsToList, vBoxedSep } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Tag",
  requiresNamespace: true,
});

function ensureTypeUsingLambda<T1>(
  outputType: FRType<T1>,
  showAs: FrOrType<T1, Lambda>,
  runLambdaToGetType: (fn: Lambda) => Value
): T1 {
  if (showAs.tag === "1") {
    return showAs.value;
  }
  const show = runLambdaToGetType(showAs.value);
  const unpack = outputType.unpack(show);
  if (unpack) {
    return unpack;
  } else {
    throw new Error("showAs must return correct type");
  }
}

// This constructs definitions where the second argument is either a type T or a function that takes in the first argument and returns a type T.
function withInputOrFnInput<T>(inputType: FRType<any>, outputType: FRType<T>) {
  return makeDefinition(
    [
      frBoxed(inputType),
      frOr(outputType, frLambdaTyped([inputType], outputType)),
    ],
    frBoxed(inputType),
    ([[args, boxedValue], showAs], context) => {
      const runLambdaToGetType = (fn: Lambda) =>
        fn.call([vBoxedSep(inputType.pack(boxedValue), args)], context);
      const showAsVal: T = ensureTypeUsingLambda(
        outputType,
        showAs,
        runLambdaToGetType
      );
      return [{ ...args, showAs: outputType.pack(showAsVal) }, boxedValue];
    }
  );
}

export const library = [
  maker.make({
    name: "name",
    examples: [],
    definitions: [
      makeDefinition(
        [frBoxed(frGeneric("A")), frString],
        frBoxed(frGeneric("A")),
        ([[boxed, boxedValue], name]) => {
          return [{ ...boxed, name }, boxedValue];
        }
      ),
    ],
  }),
  maker.make({
    name: "getName",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], frString, ([[b1, v1]]) => {
        return b1.name || "";
      }),
    ],
  }),
  maker.make({
    name: "description",
    examples: [],
    definitions: [
      makeDefinition(
        [frBoxed(frGeneric("A")), frString],
        frBoxed(frGeneric("A")),
        ([[boxed, boxedValue], description]) => {
          return [{ ...boxed, description }, boxedValue];
        }
      ),
    ],
  }),
  maker.make({
    name: "getDescription",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], frString, ([[args, _]]) => {
        return args.description || "";
      }),
    ],
  }),
  //maybe we should just allow transformations.
  maker.make({
    name: "showAs",
    examples: [],
    definitions: [
      withInputOrFnInput(frDist, frPlot),
      withInputOrFnInput(frLambda, frCalculator),
      withInputOrFnInput(frLambdaTyped([frNumber], frDistOrNumber), frPlot),
      withInputOrFnInput(frArray(frAny), frTableChart),
    ],
  }),
  maker.make({
    name: "getShowAs",
    examples: [],
    definitions: [
      // makeDefinition([frBoxed(frLambda)], frAny, ([[args, fn]], context) => {
      //   const inferredType = inferNumberToNumberOrDist(fn, context);
      //   const title = args.name || fn.name || "";
      //   if (inferredType?.type === "Dist") {
      //     return vPlot({
      //       type: "distFn",
      //       fn: fn,
      //       xScale: inferredType.domain.toDefaultScale(),
      //       distXScale: inferredType.domain.toDefaultScale(),
      //       yScale: { type: "linear" },
      //       title,
      //     });
      //   } else if (inferredType?.type === "Number") {
      //     return vPlot({
      //       type: "numericFn",
      //       fn: fn,
      //       xScale: inferredType.domain.toDefaultScale(),
      //       yScale: { type: "linear" },
      //       title,
      //     });
      //   }
      //   return vString("Could not infer type");
      //   // return args.showAs || value; // This is the default
      // }),
      makeDefinition([frBoxed(frAny)], frAny, ([[args, value]]) => {
        return args.showAs || value; // This is the default
      }),
    ],
  }),
  maker.make({
    name: "all",
    examples: [],
    definitions: [
      makeDefinition(
        [frBoxed(frAny)],
        frDictWithArbitraryKeys(frAny),
        ([[v, b]]) => {
          return ImmutableMap(boxedArgsToList(v));
        }
      ),
    ],
  }),
];
