import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "",
  requiresNamespace: false,
});

const makeUnitFn = (name: string, multiplier: number) => {
  return maker.n2n({
    name: "fromUnit_" + name,
    fn: (f) => f * multiplier,
  });
};

export const library = [
  makeUnitFn("n", 1e-9),
  makeUnitFn("m", 1e-3),
  makeUnitFn("%", 1e-2),
  makeUnitFn("k", 1e3),
  makeUnitFn("M", 1e6),
  makeUnitFn("B", 1e9),
  makeUnitFn("G", 1e9),
  makeUnitFn("T", 1e12),
  makeUnitFn("P", 1e15),
];
