import maxBy from "lodash/maxBy.js";

import { frOptionalInput } from "../library/FrInput.js";
import {
  frArray,
  frBool,
  frCalculator,
  frDict,
  frFormInput,
  frLambda,
  frNumber,
  frString,
  frTagged,
} from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import { FnFactory, typeToFormInput } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { Lambda } from "../reducer/lambda/index.js";
import { Calculator, vCalculator } from "../value/VCalculator.js";
import { FormInput } from "../value/VInput.js";

const maker = new FnFactory({
  nameSpace: "Calculator",
  requiresNamespace: true,
});

function validateCalculator(calc: Calculator): Calculator {
  const _calc = vCalculator(calc);
  const error = _calc.getError();
  if (error) {
    throw error;
  } else {
    return _calc.value;
  }
}

function getDefaultInputs(lambda: Lambda): FormInput[] {
  const longestSignature = maxBy(lambda.signatures(), (s) => s.inputs.length);
  if (!longestSignature) {
    throw new Error("No signatures found for lambda");
  }
  return longestSignature.inputs.map((input, i) => {
    const name = input.name ?? `Input ${i + 1}`;
    return typeToFormInput(input.type, name);
  });
}

export function lambdaToCalculator(lambda: Lambda): Calculator {
  const inputs = getDefaultInputs(lambda);
  return {
    fn: lambda,
    inputs,
    autorun: inputs.length !== 0,
  };
}

export const library = [
  maker.make({
    name: "make",
    examples: [
      makeFnExample(
        `Calculator.make(
{|text, textArea, select, checkbox| text + textArea},
{
  title: "My example calculator",
  inputs: [
    Input.text({ name: "text", default: "20" }),
    Input.textArea({ name: "textArea", default: "50 to 80" }),
    Input.select({ name: "select", default: "second", options: ["first", "second", "third"] }),
    Input.checkbox({ name: "checkbox", default: true }),
  ],
  sampleCount: 10k,
})`,
        { isInteractive: true }
      ),
      makeFnExample(
        `// When a calculator is created with only a function, it will guess the inputs based on the function's parameters. It won't provide default values if it's a user-written function.

({|x| x * 5}) -> Calculator`,
        { isInteractive: true }
      ),
    ],
    description: `
\`Calculator.make\` takes in a function, a description, and a list of inputs. The function should take in the same number of arguments as the number of inputs, and the arguments should be of the same type as the default value of the input.

Inputs are created using the \`Input\` module. The Input module has a few different functions for creating different types of inputs.
    
For calculators that take a long time to run, we recommend setting \`autorun\` to \`false\`. This will create a button that the user can click to run the calculator.
    `,
    definitions: [
      makeDefinition(
        [
          frDict({
            fn: frLambda,
            title: { type: frString, optional: true },
            description: { type: frString, optional: true },
            inputs: { type: frArray(frFormInput), optional: true },
            autorun: { type: frBool, optional: true },
            sampleCount: { type: frNumber, optional: true },
          }),
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
          frTagged(frLambda),
          frOptionalInput({
            name: "params",
            type: frDict({
              title: { type: frString, optional: true },
              description: { type: frString, optional: true },
              inputs: { type: frArray(frFormInput), optional: true },
              autorun: { type: frBool, optional: true },
              sampleCount: { type: frNumber, optional: true },
            }),
          }),
        ],
        frCalculator,
        ([{ value, tags }, params]) => {
          const { title, description, inputs, autorun, sampleCount } =
            params ?? {};
          return validateCalculator({
            fn: value,
            title: title || tags.name() || undefined,
            description: description || tags.doc() || undefined,
            inputs: inputs || getDefaultInputs(value),
            autorun: autorun === null || autorun === undefined ? true : autorun,
            sampleCount: sampleCount || undefined,
          });
        }
      ),
    ],
  }),
];
