import { Normal } from "../../src/dist/SymbolicDist.js";
import {
  frBool,
  frDate,
  frDistOrNumber,
  frDist,
  frNumber,
  frString,
  frTimeDuration,
  frArray,
  frTuple,
  frDictWithArbitraryKeys,
  frDict,
  frOptional,
  frAny,
  frNumberOrString,
} from "../../src/library/registry/frTypes.js";
import { ImmutableMap } from "../../src/utility/immutableMap.js";

import {
  Value,
  vArray,
  vBool,
  vDate,
  vDist,
  vNumber,
  vDict,
  vString,
  vTimeDuration,
} from "../../src/value/index.js";

test("frNumber", () => {
  const value = vNumber(5);
  expect(frNumber.unpack(value)).toBe(5);
  expect(frNumber.pack(5)).toEqual(value);
});

test("frString", () => {
  const value = vString("foo");
  expect(frString.unpack(value)).toBe("foo");
  expect(frString.pack("foo")).toEqual(value);
});

test("frBool", () => {
  const value = vBool(true);
  expect(frBool.unpack(value)).toBe(true);
  expect(frBool.pack(true)).toEqual(value);
});

test("frDate", () => {
  const date = new Date();
  const value = vDate(date);
  expect(frDate.unpack(value)).toBe(date);
  expect(frDate.pack(date)).toEqual(value);
});

test("frTimeDuration", () => {
  const duration = 1234;
  const value = vTimeDuration(duration);
  expect(frTimeDuration.unpack(value)).toBe(duration);
  expect(frTimeDuration.pack(duration)).toEqual(value);
});

describe("frDistOrNumber", () => {
  test("number", () => {
    const number = 123;
    const value = vNumber(number);
    expect(frDistOrNumber.unpack(value)).toBe(number);
    expect(frDistOrNumber.pack(number)).toEqual(value);
  });

  test("dist", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(frDistOrNumber.unpack(value)).toBe(dist);
    expect(frDistOrNumber.pack(dist)).toEqual(value);
  });
});

describe("frNumberOrString", () => {
  test("number", () => {
    const number = 123;
    const value = vNumber(number);
    expect(frNumberOrString.unpack(value)).toBe(number);
    expect(frNumberOrString.pack(number)).toEqual(value);
  });

  test("string", () => {
    const string = "foo";
    const value = vString(string);
    expect(frNumberOrString.unpack(value)).toBe(string);
    expect(frNumberOrString.pack(string)).toEqual(value);
  });
});

describe("frDist", () => {
  const dResult = Normal.make({ mean: 2, stdev: 5 });
  if (!dResult.ok) {
    throw new Error();
  }
  const dist = dResult.value;
  const value = vDist(dist);
  expect(frDist.unpack(value)).toBe(dist);
  expect(frDist.pack(dist)).toEqual(value);
});

test.todo("frLambda");
test.todo("frScale");

describe("frArray", () => {
  const arr = [3, 5, 6];
  const value = vArray(arr.map((i) => vNumber(i)));

  test("unpack number[]", () => {
    expect(frArray(frNumber).unpack(value)).toEqual(arr);
  });

  test("pack number[]", () => {
    expect(frArray(frNumber).pack(arr)).toEqual(value);
  });

  test("unpack any[]", () => {
    expect(frArray(frAny).unpack(value)).toEqual([
      vNumber(3),
      vNumber(5),
      vNumber(6),
    ]);
  });
});

describe("frTuple", () => {
  test("two elements", () => {
    const arr = [3, "foo"] as [number, string];
    const value = vArray([vNumber(arr[0]), vString(arr[1])]);
    expect(frTuple(frNumber, frString).unpack(value)).toEqual(arr);
    expect(frTuple(frNumber, frString).pack(arr)).toEqual(value);
  });

  test("five elements", () => {
    const arr = [3, "foo", 4, 5, 6] as [number, string, number, number, number];
    const value = vArray([
      vNumber(arr[0]),
      vString(arr[1]),
      vNumber(arr[2]),
      vNumber(arr[3]),
      vNumber(arr[4]),
    ]);
    const tuple = frTuple(frNumber, frString, frNumber, frNumber, frNumber);
    expect(tuple.unpack(value)).toEqual(arr);
    expect(tuple.pack(arr)).toEqual(value);
  });
});

test("frDictWithArbitraryKeys", () => {
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
  expect(frDictWithArbitraryKeys(frNumber).unpack(value)).toEqual(dict);
  expect(frDictWithArbitraryKeys(frNumber).pack(dict)).toEqual(value);
});

describe("frDict", () => {
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
    const t = frDict(["foo", frNumber], ["bar", frString]);

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
    const t = frDict(
      ["foo", frNumber],
      ["bar", frString],
      ["baz", frOptional(frString)]
    );

    expect(t.unpack(v)).toEqual(dict);
    expect(t.pack({ ...dict, baz: null })).toEqual(v);
  });
});
