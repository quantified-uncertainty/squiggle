import { FRFunction } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Math",
  requiresNamespace: true,
});

export const library: FRFunction[] = [
  // ported MathJS functions
  maker.n2n({ name: "sqrt", fn: Math.sqrt }),
  maker.n2n({ name: "sin", fn: Math.sin }),
  maker.n2n({ name: "cos", fn: Math.cos }),
  maker.n2n({ name: "tan", fn: Math.tan }),
  maker.n2n({ name: "asin", fn: Math.asin }),
  maker.n2n({ name: "acos", fn: Math.acos }),
  maker.n2n({ name: "atan", fn: Math.atan }),
  // ported MathJS functionsimport { FRFunction } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Math",
  requiresNamespace: true,
});

export const library: FRFunction[] = [
  // ported MathJS functions
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
  // Remove duplicate function definitions
  maker.n2n({ name: "subtract", fn: Math.subtract }),
];
  // ported MathJS functions
  // https://docs.google.com/spreadsheets/d/1bUK2RaBFg8aJHuzZcw9yXp8StCBH5If5sU2iRw1T_HY/edit
  // TODO - implement the rest of useful stuff
  // Remove duplicate function definitions
];import { FRFunction } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Math",
  requiresNamespace: true,
});

export const library: FRFunction[] = [
  // ported MathJS functions
  // https://docs.google.com/spreadsheets/d/1bUK2RaBFg8aJHuzZcw9yXp8StCBH5If5sU2iRw1T_HY/edit
  // TODO - implement the rest of useful stuff
  maker.n2n({ name: "sqrt", fn: Math.sqrt }),
  maker.n2n({ name: "sin", fn: Math.sin }),
  maker.n2n({ name: "cos", fn: Math.cos }),
  maker.n2n({ name: "tan", fn: Math.tan }),
  maker.n2n({ name: "asin", fn: Math.asin }),
  maker.n2n({ name: "acos", fn: Math.acos }),
  maker.n2n({ name: "atan", fn: Math.atan }),
];
  
  maker.n2n({ name: "ceil", fn: Math.ceil }),
  maker.n2n({ name: "floor", fn: Math.floor }),
  maker.n2n({ name: "max", fn: Math.max }),
  maker.n2n({ name: "mean", fn: Math.mean }),
  maker.n2n({ name: "product", fn: Math.product }),
  maker.n2n({ name: "sum", fn: Math.sum }),
  maker.n2n({ name: "abs", fn: Math.abs }),
  maker.n2n({ name: "add", fn: Math.add }),
  maker.n2n({ name: "divide", fn: Math.divide }),
  maker.n2n({ name: "exp", fn: Math.exp }),
  maker.n2n({ name: "log10", fn: Math.log10 }),
  maker.n2n({ name: "log2", fn: Math.log2 }),
  maker.n2n({ name: "pow", fn: Math.pow }),  maker.n2n({ name: "ceil", fn: Math.ceil }),
  maker.n2n({ name: "floor", fn: Math.floor }),
  maker.n2n({ name: "max", fn: Math.max }),
  maker.n2n({ name: "mean", fn: Math.mean }),
  maker.n2n({ name: "product", fn: Math.product }),
  maker.n2n({ name: "sum", fn: Math.sum }),
  maker.n2n({ name: "abs", fn: Math.abs }),
  maker.n2n({ name: "add", fn: Math.add }),
  maker.n2n({ name: "divide", fn: Math.divide }),
  maker.n2n({ name: "exp", fn: Math.exp }),
  maker.n2n({ name: "log10", fn: Math.log10 }),
  maker.n2n({ name: "log2", fn: Math.log2 }),
  maker.n2n({ name: "pow", fn: Math.pow }),
  maker.n2n({ name: "sqrt", fn: Math.sqrt }),
  maker.n2n({ name: "sin", fn: Math.sin }),
  maker.n2n({ name: "cos", fn: Math.cos }),
  maker.n2n({ name: "tan", fn: Math.tan }),
  maker.n2n({ name: "asin", fn: Math.asin }),
  maker.n2n({ name: "acos", fn: Math.acos }),
  maker.n2n({ name: "atan", fn: Math.atan }),
  // Remove duplicate function definitions
