import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
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
  frPlot,
  frString,
  frTableChart,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import {
  Value,
  vBoxed,
  vBoxedSep,
  vCalculator,
  vLambda,
  vPlot,
  vString,
  vTableChart,
  vVoid,
} from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Tag",
  requiresNamespace: true,
});

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
      makeDefinition(
        [frBoxed(frDist), frPlot],
        frBoxed(frDist),
        ([[boxed, boxedValue], showAs]) => {
          return [{ ...boxed, showAs: vPlot(showAs) }, boxedValue];
        }
      ),
      makeDefinition(
        [frBoxed(frLambdaTyped([frNumber], frDistOrNumber)), frPlot],
        frBoxed(frLambdaTyped([frNumber], frDistOrNumber)),
        ([[boxed, boxedValue], showAs]) => {
          return [{ ...boxed, showAs: vPlot(showAs) }, boxedValue];
        }
      ),
      makeDefinition(
        [
          frBoxed(frLambdaTyped([frNumber], frDistOrNumber)),
          frLambdaTyped([frLambdaTyped([frNumber], frDistOrNumber)], frAny), //really just want plot or calculator
        ],
        frBoxed(frLambdaTyped([frNumber], frDistOrNumber)),
        ([[boxed, boxedValue], showAsFn], context) => {
          const foo = showAsFn.call(
            [vBoxedSep(vLambda(boxedValue), boxed)],
            context
          );
          if (foo.type === "Plot") {
            return [{ ...boxed, showAs: vPlot(foo.value) }, boxedValue];
          } else if (foo.type === "Calculator") {
            return [{ ...boxed, showAs: vCalculator(foo.value) }, boxedValue];
          } else {
            throw new Error("showAsFn must return a Plot or Calculator");
          }
        }
      ),
      makeDefinition(
        [frBoxed(frLambda), frCalculator],
        frBoxed(frLambda),
        ([[boxed, boxedValue], showAs]) => {
          return [{ ...boxed, showAs: vCalculator(showAs) }, boxedValue];
        }
      ),
      makeDefinition(
        [frBoxed(frArray(frAny)), frTableChart],
        frBoxed(frArray(frAny)),
        ([[boxed, boxedValue], showAs]) => {
          return [{ ...boxed, showAs: vTableChart(showAs) }, boxedValue];
        }
      ),
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
          return ImmutableMap([["name", vString(v.name || "")]]);
        }
      ),
    ],
  }),
];
