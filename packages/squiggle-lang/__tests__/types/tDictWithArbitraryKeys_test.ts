import {
  tDictWithArbitraryKeys,
  tNumber,
  tString,
} from "../../src/types/index.js";
import { ImmutableMap } from "../../src/utility/immutable.js";
import { vDict, vNumber } from "../../src/value/index.js";

test("check", () => {
  const value = vDict(
    ImmutableMap([
      ["foo", vNumber(5)],
      ["bar", vNumber(6)],
    ])
  );

  expect(tDictWithArbitraryKeys(tNumber).check(value)).toBe(true);
  expect(tDictWithArbitraryKeys(tString).check(value)).toBe(false);
});
