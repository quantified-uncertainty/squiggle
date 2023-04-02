import { FRFunction } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Math",
  requiresNamespace: true,
});

export const library: FRFunction[] = [
  // ported MathJS functions
  // https://docs.google.com/spreadsheets/d/1bUK2RaBFg8aJHuzZcw9yXp8StCBH5If5sU2iRw1T_HY/edit
  // TODO - implement the rest of useful stuff
  maker.n2n({ name: "sqrt", fn: (x) => Math.pow(x, 0.5) }),
  maker.n2n({ name: "sin", fn: (x) => Math.sin(x) }),
  maker.n2n({ name: "cos", fn: (x) => Math.cos(x) }),
  maker.n2n({ name: "tan", fn: (x) => Math.tan(x) }),
  maker.n2n({ name: "asin", fn: (x) => Math.asin(x) }),
  maker.n2n({ name: "acos", fn: (x) => Math.acos(x) }),
  maker.n2n({ name: "atan", fn: (x) => Math.atan(x) }),
];
