import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frBoxed,
  frLambda,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { vBoxed, vDict, vString, vVoid } from "../value/index.js";

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
        [frBoxed(frAny), frString],
        ([[boxed, boxedValue], name]) => {
          return vBoxed({ ...boxed, value: boxedValue, name });
        }
      ),
    ],
  }),
  maker.make({
    name: "getName",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], ([[b1, v1]]) => {
        return vString(b1.name || "");
      }),
    ],
  }),
  maker.make({
    name: "description",
    examples: [],
    definitions: [
      makeDefinition(
        [frBoxed(frAny), frString],
        ([[boxed, boxedValue], description]) => {
          return vBoxed({ ...boxed, value: boxedValue, description });
        }
      ),
    ],
  }),
  maker.make({
    name: "getDescription",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], ([[b1, v1]]) => {
        return vString(b1.description || "");
      }),
    ],
  }),
  maker.make({
    name: "showAs",
    examples: [],
    definitions: [
      makeDefinition(
        [frBoxed(frAny), frAny],
        ([[boxed, boxedValue], showAs]) => {
          return vBoxed({ ...boxed, value: boxedValue, showAs });
        }
      ),
    ],
  }),
  maker.make({
    name: "getShowAs",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], ([[b1, v1]]) => {
        return b1.showAs || vVoid();
      }),
    ],
  }),
  maker.make({
    name: "getName",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], ([[b1, v1]]) => {
        return vString(b1.name || "");
      }),
    ],
  }),
  maker.make({
    name: "get",
    examples: [],
    definitions: [
      makeDefinition([frBoxed(frAny)], ([[v]]) => {
        return vDict(ImmutableMap([["name", vString(v.name || "")]]));
      }),
    ],
  }),
];
