import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frCalculator,
  frDictWithArbitraryKeys,
  frDist,
  frDistOrNumber,
  frForceBoxed,
  frLambda,
  frLambdaTyped,
  frNumber,
  frOr,
  FrOrType,
  frPlot,
  frString,
  frTableChart,
  FRType,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { Boxed } from "../value/boxed.js";
import { Value, vBool, vBoxed, vString } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Tag",
  requiresNamespace: true,
});

//I could also see inlining this into the next function, either way is fine.
function _ensureTypeUsingLambda<T1>(
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
      frForceBoxed(inputType),
      frOr(outputType, frLambdaTyped([inputType], outputType)),
    ],
    frForceBoxed(inputType),
    ([{ args, value }, showAs], context) => {
      const runLambdaToGetType = (fn: Lambda) =>
        fn.call([vBoxed(new Boxed(inputType.pack(value), args))], context);
      const showAsVal: T = _ensureTypeUsingLambda(
        outputType,
        showAs,
        runLambdaToGetType
      );
      return {
        args: args.merge({ showAs: outputType.pack(showAsVal) }),
        value,
      };
    }
  );
}

export const library = [
  maker.make({
    name: "name",
    examples: [],
    definitions: [
      makeDefinition(
        [frForceBoxed(frAny({ genericName: "A" })), frString],
        frForceBoxed(frAny({ genericName: "A" })),
        ([{ args, value }, name]) => {
          return { args: args.merge({ name }), value };
        }
      ),
    ],
  }),
  maker.make({
    name: "getName",
    examples: [],
    definitions: [
      makeDefinition([frForceBoxed(frAny())], frString, ([{ args }]) => {
        return args.value.name || "";
      }),
    ],
  }),
  maker.make({
    name: "description",
    examples: [],
    definitions: [
      makeDefinition(
        [frForceBoxed(frAny({ genericName: "A" })), frString],
        frForceBoxed(frAny({ genericName: "A" })),
        ([{ args, value }, description]) => {
          return { value: value, args: args.merge({ description }) };
        }
      ),
    ],
  }),
  maker.make({
    name: "getDescription",
    examples: [],
    definitions: [
      makeDefinition([frForceBoxed(frAny())], frString, ([{ args }]) => {
        return args.value.description || "";
      }),
    ],
  }),
  maker.make({
    name: "showAs",
    examples: [],
    definitions: [
      withInputOrFnInput(frDist, frPlot),
      withInputOrFnInput(frLambda, frCalculator),
      withInputOrFnInput(frLambdaTyped([frNumber], frDistOrNumber), frPlot),
      withInputOrFnInput(frArray(frAny()), frTableChart),
    ],
  }),
  maker.make({
    name: "getShowAs",
    examples: [],
    definitions: [
      makeDefinition([frForceBoxed(frAny())], frAny(), ([{ args }]) => {
        return args.value.showAs || vString("None"); // Not sure what to use when blank.
      }),
    ],
  }),
  maker.make({
    name: "focus",
    examples: [],
    definitions: [
      makeDefinition(
        [frForceBoxed(frAny({ genericName: "A" }))],
        frForceBoxed(frAny({ genericName: "A" })),
        ([{ args, value }]) => {
          return { value: value, args: args.merge({ focus: true }) };
        }
      ),
    ],
  }),
  maker.make({
    name: "getFocus",
    examples: [],
    definitions: [
      makeDefinition([frForceBoxed(frAny())], frAny(), ([{ args, value }]) => {
        return args.value.focus ? vBool(true) : vString("None");
      }),
    ],
  }),
  maker.make({
    name: "all",
    examples: [],
    definitions: [
      makeDefinition(
        [frForceBoxed(frAny())],
        frDictWithArbitraryKeys(frAny()),
        ([{ args }]) => {
          return args.toMap();
        }
      ),
    ],
  }),
];
