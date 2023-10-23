import { REArgumentError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDict,
  frNumberOrString,
  frOptional,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vInput } from "../value/index.js";

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
    examples: [`Input.text({ name: "First", default: "John" })`],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frNumberOrString)]
          ),
        ],
        ([vars]) => {
          return vInput({
            type: "text",
            name: vars.name,
            description: vars.description || undefined,
            default: convertInputDefault(vars.default),
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "textArea",
    output: "Input",
    examples: [`Input.textArea({ name: "First", default: "John" })`],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frNumberOrString)]
          ),
        ],
        ([vars]) => {
          return vInput({
            type: "textArea",
            name: vars.name,
            description: vars.description || undefined,
            default: convertInputDefault(vars.default),
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "checkbox",
    output: "Input",
    examples: [`Input.checkbox({ name: "First", default: true })`],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frBool)]
          ),
        ],
        ([vars]) => {
          return vInput({
            type: "checkbox",
            name: vars.name,
            description: vars.description || undefined,
            default: vars.default ?? undefined,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "select",
    output: "Input",
    examples: [
      `Input.select({ name: "First", default: "John", options: ["John", "Mary", "Sue"] })`,
    ],
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
          return vInput({
            type: "select",
            name: vars.name,
            description: vars.description || undefined,
            options: vars.options,
            default: vars.default ?? undefined,
          });
        }
      ),
    ],
  }),
];
