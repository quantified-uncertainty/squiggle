import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { FnFactory } from "../library/registry/helpers.js";
import { tDict, tLambda, tSpecification, tString } from "../types/index.js";

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
  hasErrors = List.upTo(2020, 2030)
    -> List.some(
      {|e| typeOf(fn(Date(e))) != "Distribution"}
    )
  hasErrors ? "Some results aren't distributions" : ""
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
          tDict(
            ["name", tString],
            ["documentation", tString],
            ["validate", tLambda]
          ),
        ],
        tSpecification,
        ([{ name, documentation, validate }]) => ({
          name,
          documentation,
          validate,
        })
      ),
    ],
  }),
];
