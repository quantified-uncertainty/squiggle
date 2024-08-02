import { makeDefinition } from "../library/registry/fnDefinition.js";
import { namedInput } from "../library/registry/fnInput.js";
import { FnFactory } from "../library/registry/helpers.js";
import { tAny, tArray, tString } from "../types/index.js";

const maker = new FnFactory({
  nameSpace: "String",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    description:
      "Converts any value to a string. Some information is often lost.",
    definitions: [makeDefinition([tAny()], tString, ([x]) => x.toString())],
  }),
  maker.make({
    name: "concat",
    requiresNamespace: false,
    definitions: [
      makeDefinition([tString, tString], tString, ([a, b]) => {
        return a + b;
      }),
      makeDefinition([tString, tAny()], tString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "add",
    requiresNamespace: false,
    definitions: [
      makeDefinition([tString, tString], tString, ([a, b]) => {
        return a + b;
      }),
      makeDefinition([tString, tAny()], tString, ([a, b]) => {
        return a + b.toString();
      }),
    ],
  }),
  maker.make({
    name: "split",
    definitions: [
      makeDefinition(
        [tString, namedInput("separator", tString)],
        tArray(tString),
        ([str, mark]) => {
          return str.split(mark);
        }
      ),
    ],
  }),
];
