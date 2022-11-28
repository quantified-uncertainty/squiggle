import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frArray,
  frLambda,
  frNumber,
  frRecord,
} from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import { Ok } from "../utility/result";
import { vLambdaDeclaration } from "../value";

const maker = new FnFactory({
  nameSpace: "Function",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "declare",
    output: "Declaration",
    description:
      "Adds metadata to a function of the input ranges. Works now for numeric and date inputs. This is useful when making predictions. It allows you to limit the domain that your prediction will be used and scored within.",
    examples: [
      `Function.declare({
  fn: {|a,b| a},
  inputs: [
    {min: 0, max: 100},
    {min: 30, max: 50}
  ]
})`,
    ],
    isExperimental: true,
    definitions: [
      makeDefinition(
        "declare",
        [
          frRecord(
            ["fn", frLambda],
            ["inputs", frArray(frRecord(["min", frNumber], ["max", frNumber]))]
          ),
        ],
        ([{ fn, inputs }]) => {
          return Ok(
            vLambdaDeclaration({
              fn,
              args: inputs.map((input) => ({
                ...input,
                type: "Float" as const,
              })),
            })
          );
        }
      ),
    ],
  }),
];
