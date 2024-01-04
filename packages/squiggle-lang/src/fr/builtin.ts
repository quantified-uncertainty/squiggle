import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frBool,
  frNamed,
  frOptional,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { isEqual } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "", // no namespaced versions
  requiresNamespace: false,
});

export const library = [
  maker.make({
    name: "equal",
    definitions: [
      makeDefinition([frAny(), frAny()], frBool, ([a, b]) => {
        return isEqual(a, b);
      }),
    ],
  }),
  maker.make({
    name: "unequal",
    definitions: [
      makeDefinition([frAny(), frAny()], frBool, ([a, b]) => {
        return !isEqual(a, b);
      }),
    ],
  }),
  maker.make({
    name: "typeOf",
    definitions: [
      makeDefinition([frAny()], frString, ([value]) => {
        return value.publicName;
      }),
    ],
  }),
  maker.make({
    name: "inspect",
    definitions: [
      makeDefinition(
        [frAny({ genericName: "A" }), frNamed("message", frOptional(frString))],
        frAny({ genericName: "A" }),
        ([value, message]) => {
          message ? console.log(message, value) : console.log(value);
          return value;
        }
      ),
    ],
  }),
];
