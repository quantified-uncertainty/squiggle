import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frLambda,
  frArray,
  frString,
  frOptional,
  frInput,
  frBool,
  frNumber,
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
            ["inputs", frArray(frInput)],
            ["autorun", frOptional(frBool)],
            ["sampleCount", frOptional(frNumber)]
          ),
        ],
        ([{ fn, title, description, inputs, autorun, sampleCount }]) => {
          const calc = vCalculator({
            fn,
            title: title || undefined,
            description: description || undefined,
            inputs: inputs,
            autorun: autorun == null ? true : autorun,
            sampleCount: sampleCount || undefined,
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
