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

// Also, see version.ts for System.version.

const maker = new FnFactory({
  nameSpace: "Specification",
  requiresNamespace: true,
});

export const library = [
  // It might make sense to later make this a constant, as this number shouldn't change at runtime.
  maker.make({
    name: "make",
    output: "Specification",
    description:
      "The number of samples set in the current environment. This variable can be modified in the Squiggle playground settings.",
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
