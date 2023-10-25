import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frLambda,
  frArray,
  frString,
  frOptional,
  frNumberOrString,
  frNumber,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vCalculator } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Calculator",
  requiresNamespace: true,
});

const convertFieldDefault = (value: number | string | null): string => {
  if (typeof value === "number") {
    return value.toString();
  } else if (typeof value === "string") {
    return value;
  } else {
    return "";
  }
};

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
            ["sampleCount", frOptional(frNumber)],
            [
              "fields",
              frArray(
                frDict(
                  ["name", frString],
                  ["default", frOptional(frNumberOrString)],
                  ["description", frOptional(frString)]
                )
              ),
            ]
          ),
        ],
        ([{ fn, title, description, sampleCount, fields }]) => {
          const calc = vCalculator({
            fn,
            title: title || undefined,
            description: description || undefined,
            sampleCount: sampleCount || undefined,
            fields: fields.map((vars) => ({
              name: vars.name,
              default: convertFieldDefault(vars.default),
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
