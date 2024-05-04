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
    isExperimental: true,
    examples: [
      makeFnExample(
        `@startClosed
validate(fn) = {
  errors = List.upTo(2020, 2030)
    -> List.map(
      {|e| [Date(e), typeOf(fn(Date(e))) == "Distribution"]}
    )
    -> List.filter(
      {|e| e == false}
    )
  List.length(errors) > 0 ? "Some results aren't distributions" : ""
}

spec = Spec.make(
  {
    name: "Stock market over time",
    documentation: "A distribution of stock market values over time.",
    validate: validate,
  }
)

@spec(spec)
myEstimate(t: [Date(2020), Date(2030)]) = normal(10, 3)`,
        { isInteractive: true, useForTests: false }
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
