import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frLambda,
  frSpecification,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Spec",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
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

spec = Spec.make(
  {
    title: "Stock market over time",
    documentation: "A distribution of stock market values over time.",
    validate: validate
  }
)`,
        { isInteractive: false, useForTests: false }
      ),
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["documentation", frString],
            ["validate", frLambda]
          ),
        ],
        frSpecification,
        ([{ name, documentation, validate }]) => ({
          name,
          documentation,
          validate,
        })
      ),
    ],
  }),
];
