import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frCalculator,
  frDict,
  frInput,
  frLambda,
  frNamed,
  frNumber,
  frOptional,
  frString,
  frWithTags,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { Calculator, vCalculator } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Calculator",
  requiresNamespace: true,
});

const validateCalculator = (calc: Calculator): Calculator => {
  const _calc = vCalculator(calc);
  const error = _calc.getError();
  if (error) {
    throw error;
  } else {
    return _calc.value;
  }
};

export const library = [
  maker.make({
    name: "make",
    output: "Calculator",
    examples: [
      "Calculator.make({|x| x * 5}, {inputs: [Input.text({name: 'x'})]})",
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["fn", frLambda],
            ["title", frOptional(frString)],
            ["description", frOptional(frString)],
            ["inputs", frOptional(frArray(frInput))],
            ["autorun", frOptional(frBool)],
            ["sampleCount", frOptional(frNumber)]
          ),
        ],
        frCalculator,
        ([{ fn, title, description, inputs, autorun, sampleCount }]) =>
          validateCalculator({
            fn,
            title: title || undefined,
            description: description || undefined,
            inputs: inputs || [],
            autorun: autorun === null ? true : autorun,
            sampleCount: sampleCount || undefined,
          })
      ),
      makeDefinition(
        [
          frWithTags(frLambda),
          frNamed(
            "params",
            frOptional(
              frDict(
                ["title", frOptional(frString)],
                ["description", frOptional(frString)],
                ["inputs", frOptional(frArray(frInput))],
                ["autorun", frOptional(frBool)],
                ["sampleCount", frOptional(frNumber)]
              )
            )
          ),
        ],
        frCalculator,
        ([{ value, tags }, params]) => {
          const { title, description, inputs, autorun, sampleCount } =
            params ?? {};
          return validateCalculator({
            fn: value,
            title: title || tags.value.name || undefined,
            description: description || tags.value.description || undefined,
            inputs: inputs || [],
            autorun: autorun === null || autorun === undefined ? true : autorun,
            sampleCount: sampleCount || undefined,
          });
        }
      ),
    ],
  }),
];
