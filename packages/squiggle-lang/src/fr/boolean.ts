import { frBool } from "../library/FrType.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";

const maker = new FnFactory({
  nameSpace: "Boolean",
  requiresNamespace: false,
});

export const library = [
  maker.bb2b({ name: "or", fn: (x, y) => x || y }), // infix ||
  maker.bb2b({ name: "and", fn: (x, y) => x && y }), // infix &&
  maker.make({
    name: "not",
    definitions: [
      makeDefinition([frBool], frBool, ([x]) => {
        // unary prefix !
        return !x;
      }),
    ],
  }),
];
