import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { tBool } from "../types/index.js";

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
      makeDefinition([tBool], tBool, ([x]) => {
        // unary prefix !
        return !x;
      }),
    ],
  }),
];
