import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frAny } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vString } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "String",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    output: "String",
    definitions: [
      makeDefinition([frAny], ([x]) => {
        return vString(x.toString());
      }),
    ],
  }),
];
