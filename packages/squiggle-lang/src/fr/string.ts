import { namedInput } from "../library/FrInput.js";
import { frAny, frArray, frString } from "../library/FrType.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";

const maker = new FnFactory({
  nameSpace: "String",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    description:
      "Converts any value to a string. Some information is often lost.",
    definitions: [makeDefinition([frAny()], frString, ([x]) => x.toString())],
  }),
  maker.make({
    name: "concat",
    requiresNamespace: false,
    definitions: [
      makeDefinition([frString, frString], frString, ([a, b]) => {
        return a + b;
      }),
      makeDefinition([frString, frAny()], frString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "add",
    requiresNamespace: false,
    definitions: [
      makeDefinition([frString, frString], frString, ([a, b]) => {
        return a + b;
      }),
      makeDefinition([frString, frAny()], frString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "split",
    definitions: [
      makeDefinition(
        [frString, namedInput("separator", frString)],
        frArray(frString),
        ([str, mark]) => {
          return str.split(mark);
        }
      ),
    ],
  }),
];
