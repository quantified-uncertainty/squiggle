import { makeDefinition } from "../library/registry/fnDefinition.js";
import { FnFactory } from "../library/registry/helpers.js";
import { tNumber } from "../types/index.js";

// Also, see version.ts for System.version.

const maker = new FnFactory({
  nameSpace: "System",
  requiresNamespace: true,
});

export const library = [
  // It might make sense to later make this a constant, as this number shouldn't change at runtime.
  maker.make({
    name: "sampleCount",
    description:
      "The number of samples set in the current environment. This variable can be modified in the Squiggle playground settings.",
    definitions: [
      makeDefinition(
        [],
        tNumber,
        (_, { environment }) => environment.sampleCount
      ),
    ],
  }),
];
