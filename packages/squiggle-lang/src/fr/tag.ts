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
import { ValueTags, ValueTagsType } from "../value/valueTags.js";

const maker = new FnFactory({
  nameSpace: "Tag",
  requiresNamespace: true,
});

//I could also see inlining this into the next function, either way is fine.
function _ensureTypeUsingLambda<T1>(
  outputType: FRType<T1>,
  inputValue: FrOrType<T1, Lambda>,
  runLambdaToGetType: (fn: Lambda) => Value
): T1 {
  if (inputValue.tag === "1") {
    return inputValue.value;
  }
  const show = runLambdaToGetType(inputValue.value);
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
  outputType: FRType<T>,
  toValueTagsFn: (arg: T) => ValueTagsType
) {
  return makeDefinition(
    [
      frWithTags(inputType),
      frOr(outputType, frLambdaTyped([inputType], outputType)),
    ],
    frWithTags(inputType),
    ([{ value, tags }, newInput], context) => {
      const runLambdaToGetType = (fn: Lambda) => {
        //When we call the function, we pass in the tags as well, just in case they are asked for in the call.
        const val = frWithTags(inputType).pack({ value: value, tags });
        return fn.call([val], context);
      };
      const correctTypedInputValue: T = _ensureTypeUsingLambda(
        outputType,
        newInput,
        runLambdaToGetType
      );
      return {
        value,
        tags: tags.merge(toValueTagsFn(correctTypedInputValue)),
      };
    },
    { isDecorator: true }
  );
}

function showAsDef<T>(inputType: FRType<any>, outputType: FRType<T>) {
  return decoratorWithInputOrFnInput(inputType, outputType, (result) => ({
    showAs: outputType.pack(result),
  }));
}

export const library = [
  maker.make({
    name: "name",
    description: `Adds a user-facing name to a value. This is useful for documenting what a value represents, or how it was calculated.

*Note: While names are shown in the sidebar, you still need to call variables by their regular variable names in code.*`,
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
    definitions: [
      makeDefinition([frAny()], frString, ([value]) => {
        return value.tags?.value.name || "";
      }),
    ],
  }),
  maker.make({
    name: "doc",
    description: `Adds text documentation to a value. This is useful for documenting what a value represents or how it was calculated.`,
    definitions: [
      makeDefinition(
        [frAny({ genericName: "A" }), frString],
        frAny({ genericName: "A" }),
        ([value, doc]) => value.mergeTags({ doc }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getDoc",
    definitions: [
      makeDefinition([frAny()], frString, ([value]) => {
        return value.tags?.value.doc || "";
      }),
    ],
  }),
  maker.make({
    name: "showAs",
    description: `Overrides the default visualization for a value.
\`showAs()\` can take either a visualization, or a function that calls the value and returns a visualization. You can use it like,  
\`\`\`js
example1 = {|x| x + 1} -> Tag.showAs(Calculator)
//...
@showAs({|f| Plot.numericFn(f, { xScale: Scale.symlog() })})
example2 = {|x| x + 1}
\`\`\`
Different types of values can be displayed in different ways. The following table shows the potential visualization types for each input type. In this table, \`Number\` can be used with Dates and Durations as well.  
| **Input Type**                      | **Visualization Types**               |
| ----------------------------------- | ------------------------------------- |
| **Distribution**                    | \`Plot.dist\`                         |
| **List**                            | \`Table\`                             |
| **\`(Number -> Number)\` Function** | \`Plot.numericFn\`, \`Calculator\`    |
| **\`(Number -> Dist)\` Function**   | \`Plot.distFn\`, \`Calculator\`       |
| **Function**                        | \`Calculator\`                        |
`,
    definitions: [
      showAsDef(frWithTags(frDist), frPlot),
      showAsDef(frArray(frAny()), frTableChart),
      showAsDef(
        frLambdaTyped([frNumber], frDistOrNumber),
        frOr(frPlot, frCalculator)
      ),
      showAsDef(
        frLambdaTyped([frDate], frDistOrNumber),
        frOr(frPlot, frCalculator)
      ),
      showAsDef(
        frLambdaTyped([frDuration], frDistOrNumber),
        frOr(frPlot, frCalculator)
      ),
      //The frLambda definition needs to come after the more narrow frLambdaTyped definitions.
      showAsDef(frLambda, frCalculator),
    ],
  }),
  maker.make({
    name: "getShowAs",
    definitions: [
      makeDefinition([frAny()], frAny(), ([value]) => {
        return value.tags?.value.showAs || vString("None"); // Not sure what to use when blank.
      }),
    ],
  }),
  maker.make({
    name: "format",
    description: `Set the display format for a number, distribution, duration, or date. Uses the [d3-format](https://d3js.org/d3-format) syntax on numbers and distributions, and the [d3-time-format](https://d3js.org/d3-time-format) syntax for dates.`,
    definitions: [
      makeDefinition(
        [frWithTags(frDistOrNumber), frNamed("numberFormat", frString)],
        frWithTags(frDistOrNumber),
        ([{ value, tags }, format]) => {
          checkNumericTickFormat(format);
          return { value, tags: tags.merge({ numberFormat: format }) };
        },
        { isDecorator: true }
      ),
      makeDefinition(
        [frWithTags(frDuration), frNamed("numberFormat", frString)],
        frWithTags(frDuration),
        ([{ value, tags }, format]) => {
          checkNumericTickFormat(format);
          return { value, tags: tags.merge({ numberFormat: format }) };
        },
        { isDecorator: true }
      ),
      makeDefinition(
        [frWithTags(frDate), frNamed("timeFormat", frString)],
        frWithTags(frDate),
        ([{ value, tags }, format]) => {
          return { value, tags: tags.merge({ dateFormat: format }) };
        },
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getFormat",
    examples: [],
    definitions: [
      makeDefinition([frWithTags(frDistOrNumber)], frString, ([{ tags }]) => {
        return tags?.numberFormat() || "None";
      }),
      makeDefinition([frWithTags(frDuration)], frString, ([{ tags }]) => {
        return tags?.numberFormat() || "None";
      }),
      makeDefinition([frWithTags(frDate)], frString, ([{ tags }]) => {
        return tags?.dateFormat() || "None";
      }),
    ],
  }),
  maker.make({
    name: "all",
    description: "Returns a dictionary of all tags on a value.",
    definitions: [
      makeDefinition([frAny()], frDictWithArbitraryKeys(frAny()), ([value]) => {
        return value.getTags().toMap();
      }),
    ],
  }),
  maker.make({
    name: "hide",
    description: `Hides a value when displayed under Variables. This is useful for hiding intermediate values or helper functions that are used in calculations, but are not directly relevant to the user. Only hides top-level variables.`,
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
    definitions: [
      makeDefinition([frAny()], frBool, ([value]) => {
        return value.tags?.value.hidden || false;
      }),
    ],
  }),
  maker.make({
    name: "omit",
    description: "Returns a copy of the value with the specified tags removed.",
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
    description: "Returns a copy of the value with all tags removed.",
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
