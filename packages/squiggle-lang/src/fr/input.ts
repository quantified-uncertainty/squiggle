import { REArgumentError } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDict,
  frInput,
  frNumber,
  frOptional,
  frOr,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Input",
  requiresNamespace: true,
});

const convertInputDefault = (
  value: number | string | null
): string | undefined => {
  if (typeof value === "number") {
    return value.toString();
  } else if (typeof value === "string") {
    return value;
  } else {
    return undefined;
  }
};

export const library = [
  maker.make({
    name: "text",
    output: "Input",
    examples: [
      makeFnExample(`Input.text({ name: "First", default: "John" })`),
      makeFnExample(
        `Input.text({ name: "Number of X in Y", default: '20 to 300' })`
      ),
    ],
    description:
      "Creates a single-line input. This input can be used for all Squiggle types.",
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frOr(frNumber, frString))]
          ),
        ],
        frInput,
        ([vars]) => {
          return {
            type: "text",
            name: vars.name,
            description: vars.description || undefined,
            default: convertInputDefault(vars.default?.value || null),
          };
        }
      ),
    ],
  }),
  maker.make({
    name: "textArea",
    output: "Input",
    examples: [
      makeFnExample(`Input.textArea({ name: "people", default: '{
  "John": 20 to 50, 
  "Mary": 30 to 90,
}' })`),
    ],
    description:
      "Creates a multi-line input, sized with the provided input. This input can be used for all Squiggle types.",
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frOr(frNumber, frString))]
          ),
        ],
        frInput,
        ([vars]) => {
          return {
            type: "textArea",
            name: vars.name,
            description: vars.description || undefined,
            default: convertInputDefault(vars.default?.value || null),
          };
        }
      ),
    ],
  }),
  maker.make({
    name: "checkbox",
    output: "Input",
    examples: [
      makeFnExample(`Input.checkbox({ name: "IsTrue?", default: true })`),
    ],
    description: "Creates a checkbox input. Used for Squiggle booleans.",
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frBool)]
          ),
        ],
        frInput,
        ([vars]) => {
          return {
            type: "checkbox",
            name: vars.name,
            description: vars.description || undefined,
            default: vars.default ?? undefined,
          };
        }
      ),
    ],
  }),
  maker.make({
    name: "select",
    output: "Input",
    examples: [
      makeFnExample(
        `Input.select({ name: "Name", default: "Sue", options: ["John", "Mary", "Sue"] })`
      ),
    ],
    description: "Creates a dropdown input. Used for Squiggle strings.",
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["options", frArray(frString)],
            ["default", frOptional(frString)]
          ),
        ],
        frInput,
        ([vars]) => {
          //Throw error if options are empty, if default is not in options, or if options have duplicate
          const isEmpty = () => vars.options.length === 0;
          const defaultNotInOptions = () =>
            vars.default && !vars.options.includes(vars.default as string);
          const hasDuplicates = () =>
            new Set(vars.options).size !== vars.options.length;

          if (isEmpty()) {
            throw new REArgumentError("Options cannot be empty");
          } else if (defaultNotInOptions()) {
            throw new REArgumentError(
              "Default value must be one of the options provided"
            );
          } else if (hasDuplicates()) {
            throw new REArgumentError("Options cannot have duplicate values");
          }
          return {
            type: "select",
            name: vars.name,
            description: vars.description || undefined,
            options: vars.options,
            default: vars.default ?? undefined,
          };
        }
      ),
    ],
  }),
];
