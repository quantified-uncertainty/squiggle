import { ErrorMessage } from "../errors/messages.js";
import { frInput, frOptionalInput } from "../library/FrInput.js";
import {
  frAny,
  frBool,
  frOr,
  frString,
  frTypedLambda,
} from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { tAny } from "../types/Type.js";
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
        [
          frAny({ genericName: "A" }),
          frOptionalInput({ name: "message", type: frString }),
        ],
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
      "Throws an error. You can use `try` to recover from this error.",
    definitions: [
      makeDefinition(
        [frOptionalInput({ name: "message", type: frString })],
        frAny(),
        ([value]) => {
          throw ErrorMessage.userThrowError(
            value ?? "Common.throw() was called"
          );
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
          frInput({
            name: "fn",
            type: frTypedLambda([], tAny({ genericName: "A" })),
          }),
          frInput({
            name: "fallbackFn",
            // in the future, this function could be called with the error message
            type: frTypedLambda([], tAny({ genericName: "B" })),
          }),
        ],
        frOr(frAny({ genericName: "A" }), frAny({ genericName: "B" })),
        ([fn, fallbackFn], reducer) => {
          const stackSize = reducer.stack.size();
          const frameStackSize = reducer.frameStack.frames.length;

          try {
            return { tag: "1", value: reducer.call(fn, []) };
          } catch (e) {
            if (!(e instanceof ErrorMessage)) {
              // This doesn't looks like an error in user code, treat it as fatal
              throw e;
            }

            reducer.stack.shrink(stackSize);
            while (reducer.frameStack.frames.length > frameStackSize) {
              reducer.frameStack.pop();
            }
            return { tag: "2", value: reducer.call(fallbackFn, []) };
          }
        }
      ),
    ],
  }),
];
