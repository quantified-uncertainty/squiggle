import { REArgumentError, REOther } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  checkNumericTickFormat,
  FnFactory,
} from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { namedInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import {
  tAny,
  tArray,
  tBool,
  tCalculator,
  tDate,
  tDictWithArbitraryKeys,
  tDist,
  tDistOrNumber,
  tDuration,
  tLambda,
  tNumber,
  tOr,
  tPlot,
  tSpecificationWithTags,
  tString,
  tTableChart,
  tTypedLambda,
  tWithTags,
} from "../types/index.js";
import { OrType } from "../types/TOr.js";
import { Type } from "../types/Type.js";
import { getOrThrow } from "../utility/result.js";
import { Value } from "../value/index.js";
import { ValueTags, ValueTagsType } from "../value/valueTags.js";
import { exportData, location, toMap } from "../value/valueTagsUtils.js";
import { vBool, VBool } from "../value/VBool.js";
import { vString } from "../value/VString.js";

const maker = new FnFactory({
  nameSpace: "Tag",
  requiresNamespace: true,
});

//I could also see inlining this into the next function, either way is fine.
function _ensureTypeUsingLambda<T1>(
  outputType: Type<T1>,
  inputValue: OrType<T1, Lambda>,
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

//This helps ensure that the tag name is a valid key of ValueTagsType, with the required type.
type PickByValue<T, ValueType> = NonNullable<
  keyof Pick<
    T,
    {
      [Key in keyof T]: T[Key] extends ValueType | undefined ? Key : never;
    }[keyof T]
  >
> &
  string;

const booleanTagDefs = <T>(
  tagName: PickByValue<ValueTagsType, VBool>,
  frType: Type<T>
) => [
  makeDefinition(
    [tWithTags(frType), tBool],
    tWithTags(frType),
    ([{ value, tags }, tagValue]) => ({
      value,
      tags: tags.merge({ [tagName]: vBool(tagValue) }),
    }),
    { isDecorator: true }
  ),
  makeDefinition(
    [tWithTags(frType)],
    tWithTags(frType),
    ([{ value, tags }]) => ({
      value,
      tags: tags.merge({ [tagName]: vBool(true) }),
    }),
    { isDecorator: true }
  ),
];

// This constructs definitions where the second argument is either a type T or a function that takes in the first argument and returns a type T.
function decoratorWithInputOrFnInput<T>(
  inputType: Type<any>,
  outputType: Type<T>,
  toValueTagsFn: (arg: T) => ValueTagsType
) {
  return makeDefinition(
    [
      tWithTags(inputType),
      tOr(outputType, tTypedLambda([inputType], outputType)),
    ],
    tWithTags(inputType),
    ([{ value, tags }, newInput], reducer) => {
      const runLambdaToGetType = (fn: Lambda) => {
        //When we call the function, we pass in the tags as well, just in case they are asked for in the call.
        const val = tWithTags(inputType).pack({ value: value, tags });
        return reducer.call(fn, [val]);
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

function showAsDef<T>(inputType: Type<any>, outputType: Type<T>) {
  return decoratorWithInputOrFnInput(inputType, outputType, (result) => ({
    showAs: outputType.pack(result),
  }));
}

export const library = [
  maker.make({
    name: "name",
    description: `Adds a user-facing name to a value. This is useful for documenting what a value represents, or how it was calculated.

*Note: While names are shown in the sidebar, you still need to call variables by their regular variable names in code.*`,
    displaySection: "Tags",
    definitions: [
      makeDefinition(
        [tAny({ genericName: "A" }), tString],
        tAny({ genericName: "A" }),
        ([value, name]) => value.mergeTags({ name: vString(name) }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getName",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tAny()], tString, ([value]) => {
        return value.tags?.name() || "";
      }),
    ],
  }),
  maker.make({
    name: "doc",
    description: `Adds text documentation to a value. This is useful for documenting what a value represents or how it was calculated.`,
    displaySection: "Tags",
    definitions: [
      makeDefinition(
        [tAny({ genericName: "A" }), tString],
        tAny({ genericName: "A" }),
        ([value, doc]) => value.mergeTags({ doc: vString(doc) }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getDoc",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tAny()], tString, ([value]) => {
        return value.tags?.doc() || "";
      }),
    ],
  }),
  maker.make({
    name: "showAs",
    description: `Overrides the default visualization for a value.
\`showAs()\` can take either a visualization, or a function that calls the value and returns a visualization.

Different types of values can be displayed in different ways. The following table shows the potential visualization types for each input type. In this table, \`Number\` can be used with Dates and Durations as well.  
| **Input Type**                      | **Visualization Types**               |
| ----------------------------------- | ------------------------------------- |
| **Distribution**                    | \`Plot.dist\`                         |
| **List**                            | \`Table\`                             |
| **\`(Number -> Number)\` Function** | \`Plot.numericFn\`, \`Calculator\`    |
| **\`(Number -> Dist)\` Function**   | \`Plot.distFn\`, \`Calculator\`       |
| **Function**                        | \`Calculator\`                        |
`,
    displaySection: "Tags",
    examples: [
      makeFnExample(
        `example1 = ({|x| x + 1}) -> Tag.showAs(Calculator)
@showAs({|f| Plot.numericFn(f, { xScale: Scale.symlog() })})
example2 = {|x| x + 1}`,
        { isInteractive: true, useForTests: false }
      ),
    ],
    definitions: [
      showAsDef(tWithTags(tDist), tPlot),
      showAsDef(tArray(tAny()), tTableChart),
      showAsDef(
        tTypedLambda([tNumber], tDistOrNumber),
        tOr(tPlot, tCalculator)
      ),
      showAsDef(tTypedLambda([tDate], tDistOrNumber), tOr(tPlot, tCalculator)),
      showAsDef(
        tTypedLambda([tDuration], tDistOrNumber),
        tOr(tPlot, tCalculator)
      ),
      //The frLambda definition needs to come after the more narrow frLambdaTyped definitions.
      showAsDef(tLambda, tCalculator),
    ],
  }),
  maker.make({
    name: "getShowAs",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tAny()], tAny(), ([value]) => {
        return value.tags?.value.showAs || vString("None"); // Not sure what to use when blank.
      }),
    ],
  }),
  maker.make({
    name: "getExportData",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tWithTags(tAny())], tAny(), ([{ tags }]) => {
        return exportData(tags) || vString("None");
      }),
    ],
  }),
  maker.make({
    name: "spec",
    description: `Adds a specification to a value. This is useful for documenting how a value was calculated, or what it represents.`,
    displaySection: "Tags",
    definitions: [
      makeDefinition(
        [tWithTags(tAny({ genericName: "A" })), tSpecificationWithTags],
        tWithTags(tAny({ genericName: "A" })),
        ([{ value, tags }, spec]) => {
          if (tags.specification()) {
            throw new REArgumentError(
              "Specification already exists. Be sure to use Tag.omit() first."
            );
          }
          return {
            value,
            tags: tags.merge({
              specification: spec,
              name: vString(spec.value.name),
              doc: vString(spec.value.documentation),
            }),
          };
        },
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getSpec",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tWithTags(tAny())], tAny(), ([value]) => {
        return value.tags?.value.specification || vString("None");
      }),
    ],
  }),
  maker.make({
    name: "format",
    description: `Set the display format for a number, distribution, duration, or date. Uses the [d3-format](https://d3js.org/d3-format) syntax on numbers and distributions, and the [d3-time-format](https://d3js.org/d3-time-format) syntax for dates.`,
    displaySection: "Tags",
    definitions: [
      makeDefinition(
        [tWithTags(tDistOrNumber), namedInput("numberFormat", tString)],
        tWithTags(tDistOrNumber),
        ([{ value, tags }, format]) => {
          checkNumericTickFormat(format);
          return { value, tags: tags.merge({ numberFormat: vString(format) }) };
        },
        { isDecorator: true }
      ),
      makeDefinition(
        [tWithTags(tDuration), namedInput("numberFormat", tString)],
        tWithTags(tDuration),
        ([{ value, tags }, format]) => {
          checkNumericTickFormat(format);
          return { value, tags: tags.merge({ numberFormat: vString(format) }) };
        },
        { isDecorator: true }
      ),
      makeDefinition(
        [tWithTags(tDate), namedInput("timeFormat", tString)],
        tWithTags(tDate),
        ([{ value, tags }, format]) => {
          return { value, tags: tags.merge({ dateFormat: vString(format) }) };
        },
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getFormat",
    displaySection: "Tags",
    examples: [],
    definitions: [
      makeDefinition([tWithTags(tDistOrNumber)], tString, ([{ tags }]) => {
        return tags?.numberFormat() || "None";
      }),
      makeDefinition([tWithTags(tDuration)], tString, ([{ tags }]) => {
        return tags?.numberFormat() || "None";
      }),
      makeDefinition([tWithTags(tDate)], tString, ([{ tags }]) => {
        return tags?.dateFormat() || "None";
      }),
    ],
  }),
  maker.make({
    name: "hide",
    description: `Hides a value when displayed under Variables. This is useful for hiding intermediate values or helper functions that are used in calculations, but are not directly relevant to the user. Only hides top-level variables.`,
    displaySection: "Tags",
    definitions: booleanTagDefs("hidden", tAny({ genericName: "A" })),
  }),
  maker.make({
    name: "getHide",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tAny()], tBool, ([value]) => {
        return value.getTags().hidden() ?? false;
      }),
    ],
  }),
  maker.make({
    name: "startOpen",
    description: `When the value is first displayed, it will begin open in the viewer. Refresh the page to reset.`,
    displaySection: "Tags",
    definitions: [
      makeDefinition(
        [tWithTags(tAny({ genericName: "A" }))],
        tWithTags(tAny({ genericName: "A" })),
        ([{ value, tags }]) => ({
          value,
          tags: tags.merge({ startOpenState: vString("open") }),
        }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "startClosed",
    description: `When the value is first displayed, it will begin collapsed in the viewer. Refresh the page to reset.`,
    displaySection: "Tags",
    definitions: [
      makeDefinition(
        [tWithTags(tAny({ genericName: "A" }))],
        tWithTags(tAny({ genericName: "A" })),
        ([{ value, tags }]) => ({
          value,
          tags: tags.merge({ startOpenState: vString("closed") }),
        }),
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getStartOpenState",
    displaySection: "Tags",
    description: `Returns the startOpenState of a value, which can be "open", "closed", or "" if no startOpenState is set. Set using \`Tag.startOpen\` and \`Tag.startClosed\`.`,
    definitions: [
      makeDefinition(
        [tWithTags(tAny())],
        tString,
        ([{ tags }]) => tags?.value.startOpenState?.value ?? ""
      ),
    ],
  }),
  maker.make({
    name: "notebook",
    description: `Displays the list of values as a notebook. This means that element indices are hidden, and the values are displayed in a vertical list. Useful for displaying combinations of text and values.`,
    examples: [
      makeFnExample(
        `Calculator.make(
  {|f, contents| f ? Tag.notebook(contents) : contents},
  {
    description: "Shows the contents as a notebook if the checkbox is checked.",
    inputs: [
      Input.checkbox({ name: "Show as Notebook", default: true }),
      Input.textArea(
        {
          name: "Contents to show",
          default: "[
  \\"## Distribution 1\\",
  normal(5, 2),
  \\"## Distribution 1\\",
  normal(20, 1),
  \\"This is an opening section. Here is more text.
\\",
]",
        }
      ),
    ],
  }
)`,
        { isInteractive: true }
      ),
    ],
    displaySection: "Tags",
    definitions: booleanTagDefs("notebook", tArray(tAny({ genericName: "A" }))),
  }),
  maker.make({
    name: "getNotebook",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tAny()], tBool, ([value]) => {
        return value.tags?.notebook() ?? false;
      }),
    ],
  }),
  maker.make({
    name: "location",
    description: `Saves the location of a value. Note that this must be called at the point where the location is to be saved. If you use it in a helper function, it will save the location of the helper function, not the location where the helper function is called.`,
    displaySection: "Tags",
    definitions: [
      makeDefinition(
        [tWithTags(tAny({ genericName: "A" }))],
        tWithTags(tAny({ genericName: "A" })),
        ([{ value, tags }], { frameStack }) => {
          const location = frameStack.getTopFrame()?.location;
          if (!location) {
            throw new REOther("Location is missing in call stack");
          }
          return {
            value,
            tags: tags.merge({ location }),
          };
        },
        { isDecorator: true }
      ),
    ],
  }),
  maker.make({
    name: "getLocation",
    displaySection: "Tags",
    definitions: [
      makeDefinition([tWithTags(tAny())], tAny(), ([{ tags }]) => {
        return location(tags) || vString("None");
      }),
    ],
  }),
  maker.make({
    name: "getAll",
    displaySection: "Functions",
    description: "Returns a dictionary of all tags on a value.",
    definitions: [
      makeDefinition([tAny()], tDictWithArbitraryKeys(tAny()), ([value]) => {
        return toMap(value.getTags());
      }),
    ],
  }),
  maker.make({
    name: "omit",
    description: "Returns a copy of the value with the specified tags removed.",
    displaySection: "Functions",
    definitions: [
      makeDefinition(
        [tWithTags(tAny({ genericName: "A" })), tArray(tString)],
        tWithTags(tAny({ genericName: "A" })),
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
    displaySection: "Functions",
    description: "Returns a copy of the value with all tags removed.",
    definitions: [
      makeDefinition(
        [tWithTags(tAny({ genericName: "A" }))],
        tWithTags(tAny({ genericName: "A" })),
        ([{ value }]) => {
          return { value, tags: new ValueTags({}) };
        }
      ),
    ],
  }),
];
