import { makeFnExample } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { tNumber, tWithTags } from "../types/index.js";
import { ValueTags } from "../value/valueTags.js";
import { vString } from "../value/VString.js";

const maker = new FnFactory({
  nameSpace: "",
  requiresNamespace: false,
});

const makeUnitFn = (
  shortName: string,
  fullName: string,
  multiplier: number,
  format?: string
) => {
  return maker.make({
    name: "fromUnit_" + shortName,
    description: `Unit conversion from ${fullName}.`,
    examples: [makeFnExample(`3${shortName} // ${3 * multiplier}`)],
    isUnit: true,
    definitions: [
      format
        ? makeDefinition([tNumber], tWithTags(tNumber), ([x]) => {
            return {
              value: x * multiplier,
              tags: new ValueTags({ numberFormat: vString(format) }),
            };
          })
        : makeDefinition([tNumber], tNumber, ([x]) => x * multiplier),
    ],
  });
};

export const library = [
  makeUnitFn("n", "nano", 1e-9),
  makeUnitFn("m", "mili", 1e-3),
  makeUnitFn("%", "percent", 1e-2, ".2~p"),
  makeUnitFn("k", "kilo", 1e3),
  makeUnitFn("M", "mega", 1e6),
  makeUnitFn("B", "billion", 1e9),
  makeUnitFn("G", "giga", 1e9),
  makeUnitFn("T", "tera", 1e12),
  makeUnitFn("P", "peta", 1e15),
];
