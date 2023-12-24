import { REArgumentError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
  frCalculator,
  frDate,
  frDictWithArbitraryKeys,
  frDist,
  frDistOrNumber,
  frDuration,
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
  frWithTags,
} from "../library/registry/frTypes.js";
import {
  checkNumericTickFormat,
  FnFactory,
} from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { getOrThrow } from "../utility/result.js";
import { Value, vString } from "../value/index.js";
import { ValueTags } from "../value/valueTags.js";

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
function decoratorWithInputOrFnInput<T>(
  inputType: FRType<any>,
  outputType: FRType<T>
) {
  return makeDefinition(
    [
      frWithTags(inputType),
      frOr(outputType, frLambdaTyped([inputType], outputType)),
    ],
    frWithTags(inputType),
    ([{ value, tags }, showAs], context) => {
      const runLambdaToGetType = (fn: Lambda) =>
        fn.call([inputType.pack(value)], context);
      const showAsVal: T = _ensureTypeUsingLambda(
        outputType,
        showAs,
        runLambdaToGetType
      );
      return {
        value,
        tags: tags.merge({ showAs: outputType.pack(showAsVal) }),
      };
    },
    { isDecorator: true }
  );
}

export const library = [
  maker.make({
    name: "name",
    examples: [],
    definitions: [
      makeDefinition(
        [frAny({ genericName: "A" }), frString],
        frAny({ genericName: "A" }),
        ([value, name]) => value.mergeTags({ name }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getName",
    examples: [],
    definitions: [
      makeDefinition([frAny()], frString, ([value]) => {
        return value.tags?.value.name || "";
      }),
    ],
  }),
  maker.make({
    name: "description",
    examples: [],
    definitions: [
      makeDefinition(
        [frAny({ genericName: "A" }), frString],
        frAny({ genericName: "A" }),
        ([value, description]) => value.mergeTags({ description }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getDescription",
    examples: [],
    definitions: [
      makeDefinition([frAny()], frString, ([value]) => {
        return value.tags?.value.description || "";
      }),
    ],
  }),
  maker.make({
    name: "showAs",
    examples: [],
    definitions: [
      decoratorWithInputOrFnInput(frDist, frPlot),
      decoratorWithInputOrFnInput(frArray(frAny()), frTableChart),
      decoratorWithInputOrFnInput(
        frLambdaTyped([frNumber], frDistOrNumber),
        frPlot
      ),
      decoratorWithInputOrFnInput(
        frLambdaTyped([frDate], frDistOrNumber),
        frPlot
      ),
      decoratorWithInputOrFnInput(
        frLambdaTyped([frDuration], frDistOrNumber),
        frPlot
      ),
      //The frLambda definition needs to come after the more narrow frLambdaTyped definitions.
      decoratorWithInputOrFnInput(frLambda, frCalculator),
    ],
  }),
  maker.make({
    name: "getShowAs",
    examples: [],
    definitions: [
      makeDefinition([frAny()], frAny(), ([value]) => {
        return value.tags?.value.showAs || vString("None"); // Not sure what to use when blank.
      }),
    ],
  }),
  maker.make({
    name: "format",
    examples: [],
    definitions: [
      makeDefinition(
        [frWithTags(frDistOrNumber), frNamed("numberFormat", frString)],
        frWithTags(frDistOrNumber),
        ([{ value, tags }, format]) => {
          checkNumericTickFormat(format);
          return { value, tags: tags.merge({ numberFormat: format }) };
        }
      ),
      makeDefinition(
        [frWithTags(frDuration), frNamed("numberFormat", frString)],
        frWithTags(frDuration),
        ([{ value, tags }, format]) => {
          checkNumericTickFormat(format);
          return { value, tags: tags.merge({ numberFormat: format }) };
        }
      ),
      makeDefinition(
        [frWithTags(frDate), frNamed("timeFormat", frString)],
        frWithTags(frDate),
        ([{ value, tags }, format]) => {
          return { value, tags: tags.merge({ dateFormat: format }) };
        }
      ),
    ],
  }),
  maker.make({
    name: "all",
    examples: [],
    definitions: [
      makeDefinition([frAny()], frDictWithArbitraryKeys(frAny()), ([value]) => {
        return value.getTags().toMap();
      }),
    ],
  }),
  maker.make({
    name: "hide",
    examples: [],
    definitions: [
      makeDefinition(
        [frAny({ genericName: "A" }), frBool],
        frAny({ genericName: "A" }),
        ([value, hidden]) => value.mergeTags({ hidden }),
        { isDecorator: true }
      ),
      makeDefinition(
        [frAny({ genericName: "A" })],
        frAny({ genericName: "A" }),
        ([value]) => value.mergeTags({ hidden: true }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getHide",
    examples: [],
    definitions: [
      makeDefinition([frAny()], frBool, ([value]) => {
        return value.tags?.value.hidden || false;
      }),
    ],
  }),
  maker.make({
    name: "omit",
    examples: [],
    definitions: [
      makeDefinition(
        [frWithTags(frAny({ genericName: "A" })), frArray(frString)],
        frWithTags(frAny({ genericName: "A" })),
        ([{ tags, value }, parameterNames]) => {
          const newParams = tags.omitUsingStringKeys([...parameterNames]);
          const _args = getOrThrow(newParams, (e) => new REArgumentError(e));
          return { tags: _args, value };
        }
      ),
    ],
  }),
  maker.make({
    name: "clear",
    examples: [],
    definitions: [
      makeDefinition(
        [frWithTags(frAny({ genericName: "A" }))],
        frWithTags(frAny({ genericName: "A" })),
        ([{ value }]) => {
          return { value, tags: new ValueTags({}) };
        }
      ),
    ],
  }),
];
