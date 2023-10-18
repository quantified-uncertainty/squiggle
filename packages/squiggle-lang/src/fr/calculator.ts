import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frLambda,
  frArray,
  frString,
  frOptional,
  frInput,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vCalculator } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Calculator",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    output: "Calculator",
    examples: [],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["fn", frLambda],
            ["title", frOptional(frString)],
            ["description", frOptional(frString)],
            ["fields", frArray(frInput)]
          ),
        ],
        ([{ fn, title, description, fields }]) => {
          const calc = vCalculator({
            fn,
            title: title || undefined,
            description: description || undefined,
            fields: fields,
          });
          const error = calc.getError();
          if (error) {
            throw error;
          } else {
            return calc;
          }
        }
      ),
    ],
  }),
];
