import { REArgumentError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frCalculator,
  frDate,
  frDictWithArbitraryKeys,
  frDist,
  frDistOrNumber,
  frDuration,
  frForceBoxed,
  frLambda,
  frLambdaTyped,
  frNamed,
  frNumber,
  frOr,
  FrOrType,
  frPlot,
  frString,
  frTableChart,
  FRType,
} from "../library/registry/frTypes.js";
import {
  checkNumericTickFormat,
  FnFactory,
} from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { mergeMany } from "../utility/result.js";
import {
  Boxed,
  BoxedArgs,
  convertToBoxedArgsTypeName,
} from "../value/boxed.js";
import { Value, vBoxed, vString } from "../value/index.js";

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
    name: "omit",
    examples: [],
    definitions: [
      makeDefinition(
        [frForceBoxed(frAny({ genericName: "A" })), frArray(frString)],
        frForceBoxed(frAny({ genericName: "A" })),
        ([{ args, value }, parameterNames]) => {
          const _parameterNames = mergeMany(
            parameterNames.map(convertToBoxedArgsTypeName)
          );
          if (!_parameterNames.ok) {
            throw new REArgumentError(_parameterNames.value);
          } else {
            const newArgs = args.omit(_parameterNames.value);
            return { value: value, args: newArgs };
          }
        }
      ),
    ],
  }),
  maker.make({
    name: "clear",
    examples: [],
    definitions: [
      makeDefinition(
        [frForceBoxed(frAny({ genericName: "A" }))],
        frForceBoxed(frAny({ genericName: "A" })),
        ([{ value }]) => {
          return { value, args: new BoxedArgs({}) };
        }
      ),
    ],
  }),
  maker.make({
    name: "showAs",
    examples: [],
    definitions: [
      withInputOrFnInput(frDist, frPlot),
      withInputOrFnInput(frLambdaTyped([frNumber], frDistOrNumber), frPlot),
      withInputOrFnInput(frLambdaTyped([frDate], frDistOrNumber), frPlot),
      withInputOrFnInput(frLambdaTyped([frDuration], frDistOrNumber), frPlot),
      //The frLambda definition needs to come after the more narrow frLambdaTyped definitions.
      withInputOrFnInput(frLambda, frCalculator),
      withInputOrFnInput(frArray(frAny()), frTableChart),
    ],
  }),
  maker.make({
    name: "getShowAs",
    examples: [],
    definitions: [
      makeDefinition([frForceBoxed(frAny())], frAny(), ([{ args, value }]) => {
        return args.value.showAs || vString("None"); // Not sure what to use when blank.
      }),
    ],
  }),
  maker.make({
    name: "format",
    examples: [],
    definitions: [
      makeDefinition(
        [frForceBoxed(frDistOrNumber), frNamed("numberFormat", frString)],
        frForceBoxed(frDistOrNumber),
        ([{ args, value }, format]) => {
          checkNumericTickFormat(format);
          return { args: args.merge({ numberFormat: format }), value };
        }
      ),
      makeDefinition(
        [frForceBoxed(frDuration), frNamed("numberFormat", frString)],
        frForceBoxed(frDuration),
        ([{ args, value }, format]) => {
          checkNumericTickFormat(format);
          return { args: args.merge({ numberFormat: format }), value };
        }
      ),
      makeDefinition(
        [frForceBoxed(frDate), frNamed("timeFormat", frString)],
        frForceBoxed(frDate),
        ([{ args, value }, format]) => {
          return { args: args.merge({ dateFormat: format }), value };
        }
      ),
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
