import { tDictWithArbitraryKeys, tNumber } from "../../src/types";
import { ImmutableMap } from "../../src/utility/immutable";
import { vDict, vNumber } from "../../src/value";

test("pack/unpack", () => {
  const dict = ImmutableMap([
    ["foo", 5],
    ["bar", 6],
  ]);
  const value = vDict(
    ImmutableMap([
      ["foo", vNumber(5)],
      ["bar", vNumber(6)],
    ])
  );
  expect(tDictWithArbitraryKeys(tNumber).unpack(value)).toEqual(dict);
  expect(tDictWithArbitraryKeys(tNumber).pack(dict)).toEqual(value);
});
