import { tDict, tNumber, tString } from "../../src/types/index.js";
import { ImmutableMap } from "../../src/utility/immutable.js";
import { Value, vDict, vNumber, vString } from "../../src/value/index.js";

test("two keys", () => {
  const dict = {
    foo: 5,
    bar: "hello",
  };
  const v = vDict(
    ImmutableMap<string, Value>([
      ["foo", vNumber(dict.foo)],
      ["bar", vString(dict.bar)],
    ])
  );
  const t = tDict(["foo", tNumber], ["bar", tString]);

  expect(t.unpack(v)).toEqual(dict);
  expect(t.pack(dict)).toEqual(v);
});

test("with optionals", () => {
  const dict = {
    foo: 5,
    bar: "hello",
  };
  const v = vDict(
    ImmutableMap<string, Value>([
      ["foo", vNumber(dict.foo)],
      ["bar", vString(dict.bar)],
    ])
  );
  const t = tDict(["foo", tNumber], ["bar", tString], {
    key: "baz",
    type: tString,
    optional: true,
  });

  expect(t.unpack(v)).toEqual(dict);
  expect(t.pack({ ...dict, baz: null })).toEqual(v);
});
