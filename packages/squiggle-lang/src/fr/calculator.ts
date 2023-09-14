import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frLambda,
  frArray,
  frString,
  frOptional,
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
            ["description", frOptional(frString)],
            [
              "fields",
              frArray(
                frDict(
                  ["name", frString],
                  ["default", frOptional(frString)],
                  ["description", frOptional(frString)]
                )
              ),
            ]
          ),
        ],
        ([{ fn, description, fields }]) => {
          const calc = vCalculator({
            fn,
            description: description || undefined,
            fields: fields.map((vars) => ({
              name: vars.name,
              default: vars.default || "",
              description: vars.description || undefined,
            })),
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
