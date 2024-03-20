import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frLambda,
  frOptional,
  frSpecification,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vSpecification } from "../value/VSpecification.js";

const maker = new FnFactory({
  nameSpace: "Specification",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    output: "Specification",
    description: "Create a specification.",
    examples: [
      makeFnExample(
        `validate(fn) = {
  errors = List.upTo(2020, 2030)
    -> List.map(
      {|e| [Date(e), typeOf(fn(Date(e))) == "Distribution"]}
    )
    -> List.filter(
      {|e| true}
    )
  "Has errors!"
}

spec = Specification.make(
  {
    title: "Stock market over time",
    description: "The S&P500 stock market price, over time.",
    validate: validate,
    showAs: {|e| e(Date(2024))},
  }
)`,
        { isInteractive: false, useForTests: false }
      ),
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["title", frString],
            ["description", frOptional(frString)],
            ["validate", frLambda],
            ["showAs", frOptional(frLambda)]
          ),
        ],
        frSpecification,
        ([{ title, description, validate, showAs }]) =>
          vSpecification({
            title,
            description: description || undefined,
            validate,
            showAs: showAs || undefined,
          }).value
      ),
    ],
  }),
];
