import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  FRType,
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
import {
  BoxedArgs,
  boxedArgsToList,
  vBoxedSep,
  vVoid,
} from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Tag",
  requiresNamespace: true,
});

function ensureTypeUsingLambda<T1>(
  outputType: FRType<T1>,
  inputType: FRType<Lambda>,
  showAs: { tag: "1"; value: T1 } | { tag: "2"; value: Lambda },
  inputValue: Lambda,
  args: BoxedArgs,
  context: any
) {
  if (showAs.tag === "1") {
    return showAs.value;
  } else {
    const show = showAs.value.call(
      [vBoxedSep(inputType.pack(inputValue), args)],
      context
    );
    const unpack = outputType.unpack(show);
    if (unpack) {
      return unpack;
    } else {
      throw new Error("showAs must return correct type");
    }
  }
}

const showAsConvert = (inputType: FRType<any>, outputType: FRType<any>) =>
  makeDefinition(
    [
      frBoxed(inputType),
      frOr(outputType, frLambdaTyped([inputType], outputType)),
    ],
    frBoxed(inputType),
    ([[boxed, boxedValue], showAs], context) => {
      const showAsVal = ensureTypeUsingLambda(
        outputType,
        inputType,
        showAs,
        boxedValue,
        boxed,
        context
      );
      return [{ ...boxed, showAs: outputType.pack(showAsVal) }, boxedValue];
    }
  );

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
      makeDefinition([frBoxed(frAny)], frString, ([[b1, v1]]) => {
        return b1.description || "";
      }),
    ],
  }),
  maker.make({
    name: "showAs",
    examples: [],
    definitions: [
      showAsConvert(frDist, frPlot),
      showAsConvert(frLambda, frCalculator),
      showAsConvert(frLambdaTyped([frNumber], frDistOrNumber), frPlot),
      showAsConvert(frBoxed(frArray(frAny)), frTableChart),
    ],
  }),
  maker.make({
    name: "getShowAs",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], frAny, ([[b1, v1]]) => {
        return b1.showAs || vVoid();
      }),
    ],
  }),
  maker.make({
    name: "get",
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
