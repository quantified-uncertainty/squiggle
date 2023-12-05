import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frAny, frBoxed, frString } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { vBoxed, vDict, vString } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Tag",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "name",
    examples: [],
    definitions: [
      makeDefinition([frAny, frString], ([value, name]) => {
        return vBoxed({ value, name });
      }),
      makeDefinition([frBoxed(frAny)], ([value]) => {
        return vString(value.name || "");
      }),
    ],
  }),
  maker.make({
    name: "get",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], ([v]) => {
        return vDict(ImmutableMap([["name", vString(v.name || "")]]));
      }),
      makeDefinition([frAny], ([v]) => {
        return vDict(ImmutableMap([["name", vString("")]]));
      }),
    ],
  }),
];
