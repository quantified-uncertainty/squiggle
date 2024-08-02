import { BaseErrorMessage, REThrow } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { fnInput } from "../library/registry/fnInput.js";
import { FnFactory } from "../library/registry/helpers.js";
import { tAny, tBool, tLambdaTyped, tOr, tString } from "../types/index.js";
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
      makeDefinition([tAny(), tAny()], tBool, ([a, b]) => {
        return isEqual(a, b);
      }),
    ],
  }),
  maker.make({
    name: "unequal",
    definitions: [
      makeDefinition([tAny(), tAny()], tBool, ([a, b]) => {
        return !isEqual(a, b);
      }),
    ],
  }),
  maker.make({
    name: "typeOf",
    description:
      "Returns the type of the value passed in as a string. This is useful when you want to treat a value differently depending on its type.",
    examples: [
      makeFnExample(
        `myString = typeOf("foo")
myBool = typeOf(true)
myDist = typeOf(5 to 10)
myFn = typeOf({|e| e})`,
        { isInteractive: true }
      ),
    ],
    definitions: [
      makeDefinition([tAny()], tString, ([value]) => {
        return value.publicName;
      }),
    ],
  }),
  maker.make({
    name: "inspect",
    description: `Runs Console.log() in the [Javascript developer console](https://www.digitalocean.com/community/tutorials/how-to-use-the-javascript-developer-console) and returns the value passed in.`,
    definitions: [
      makeDefinition(
        [
          tAny({ genericName: "A" }),
          fnInput({ name: "message", type: tString, optional: true }),
        ],
        tAny({ genericName: "A" }),
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
      "Throws an error. You can use `try` to recover from this error.",
    definitions: [
      makeDefinition(
        [fnInput({ name: "message", optional: true, type: tString })],
        tAny(),
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
  maker.make({
    name: "try",
    description:
      "Try to run a function and return its result. If the function throws an error, return the result of the fallback function instead.",
    definitions: [
      makeDefinition(
        [
          fnInput({
            name: "fn",
            type: tLambdaTyped([], tAny({ genericName: "A" })),
          }),
          fnInput({
            name: "fallbackFn",
            // in the future, this function could be called with the error message
            type: tLambdaTyped([], tAny({ genericName: "B" })),
          }),
        ],
        tOr(tAny({ genericName: "A" }), tAny({ genericName: "B" })),
        ([fn, fallbackFn], reducer) => {
          try {
            return { tag: "1", value: reducer.call(fn, []) };
          } catch (e) {
            if (!(e instanceof BaseErrorMessage)) {
              // This doesn't looks like an error in user code, treat it as fatal
              throw e;
            }
            return { tag: "2", value: reducer.call(fallbackFn, []) };
          }
        }
      ),
    ],
  }),
];
