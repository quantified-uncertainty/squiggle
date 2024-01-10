import { REThrow } from "../errors/messages.js";
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
  nameSpace: "Common", // no namespaced versions
  requiresNamespace: false,
});

export const library = [
  maker.make({
    name: "equal",
    description: `Returns true if the two values passed in are equal, false otherwise. Does not work for Squiggle functions, but works for most other types.`,
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
    description:
      "Returns the type of the value passed in as a string. This is useful when you want to treat a value differently depending on its type.",
    interactiveExamples: [
      `myString = typeOf("foo")
myBool = typeOf(true)
myDist = typeOf(5 to 10)
myFn = typeOf({|e| e})`,
    ],
    definitions: [
      makeDefinition([frAny()], frString, ([value]) => {
        return value.publicName;
      }),
    ],
  }),
  maker.make({
    name: "inspect",
    description: `Runs Console.log() in the [Javascript developer console](https://www.digitalocean.com/community/tutorials/how-to-use-the-javascript-developer-console) and returns the value passed in.`,
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
  maker.make({
    name: "throw",
    description:
      "Throws a fatal error. There is no way in the language to catch this error.",
    definitions: [
      makeDefinition(
        [frOptional(frNamed("message", frString))],
        frAny(),
        ([value]) => {
          if (value) {
            throw new REThrow(value);
          } else {
            throw new REThrow("Common.throw() was called");
          }
        }
      ),
    ],
  }),
];
