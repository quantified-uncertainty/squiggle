import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frAny, frArray, frString } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "String",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    output: "String",
    definitions: [makeDefinition([frAny], frString, ([x]) => x.toString())],
  }),
  maker.make({
    name: "split",
    definitions: [
      makeDefinition([frString, frString], frArray(frString), ([str, mark]) => {
        return str.split(mark);
      }),
    ],
  }),
];
