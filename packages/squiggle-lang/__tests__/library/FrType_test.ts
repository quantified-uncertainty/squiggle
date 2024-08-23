import { PointSetDist } from "../../src/dists/PointSetDist.js";
import { SampleSetDist } from "../../src/dists/SampleSetDist/index.js";
import { Normal } from "../../src/dists/SymbolicDist/Normal.js";
import { SDuration } from "../../src/index.js";
import {
  frDict,
  frDictWithArbitraryKeys,
  frDist,
  frDistOrNumber,
  frDuration,
  frFormInput,
  frNumber,
  frOr,
  frPointSetDist,
  frSampleSetDist,
  frString,
  frSymbolicDist,
  frTagged,
  frTuple,
} from "../../src/library/FrType.js";
import { ContinuousShape } from "../../src/PointSet/Continuous.js";
import { DiscreteShape } from "../../src/PointSet/Discrete.js";
import { MixedShape } from "../../src/PointSet/Mixed.js";
import { ImmutableMap } from "../../src/utility/immutable.js";
import {
  Value,
  vArray,
  vDict,
  vDist,
  vDuration,
  vNumber,
  vString,
} from "../../src/value/index.js";
import { ValueTags } from "../../src/value/valueTags.js";
import { FormInput, vInput } from "../../src/value/VInput.js";

describe("frNumber", () => {
  test("pack/unpack", () => {
    const value = vNumber(5);
    expect(frNumber.unpack(value)).toBe(5);
    expect(frNumber.pack(5)).toEqual(value);
  });
});

describe("frDuration", () => {
  test("pack/unpack", () => {
    const duration = SDuration.fromMs(1234);
    const value = vDuration(duration);
    expect(frDuration.unpack(value)).toBe(duration);
    expect(frDuration.pack(duration)).toEqual(value);
  });
});

describe("frFormInput", () => {
  test("pack/unpack", () => {
    const input: FormInput = { name: "first", type: "text" };
    const value = vInput(input);
    expect(frFormInput.unpack(value)).toBe(input);
    expect(frFormInput.pack(input)).toEqual(value);
  });
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
    const t = frDict(["foo", frNumber], ["bar", frString], {
      key: "baz",
      type: frString,
      optional: true,
    });

    expect(t.unpack(v)).toEqual(dict);
    expect(t.pack({ ...dict, baz: null })).toEqual(v);
  });
});

describe("frDictWithArbitraryKeys", () => {
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
    expect(frDictWithArbitraryKeys(frNumber).unpack(value)).toEqual(dict);
    expect(frDictWithArbitraryKeys(frNumber).pack(dict)).toEqual(value);
  });
});

describe("frOr", () => {
  const numberOrString = frOr(frNumber, frString);

  test("should correctly unpack a number", () => {
    const numberValue = vNumber(10);
    const unpacked = numberOrString.unpack(numberValue);
    expect(unpacked).toEqual({ tag: "1", value: 10 });
  });

  test("should correctly unpack a string", () => {
    const stringValue = vString("hello");
    const unpacked = numberOrString.unpack(stringValue);
    expect(unpacked).toEqual({ tag: "2", value: "hello" });
  });

  test("should correctly unpack falsy value", () => {
    const numberValue = vNumber(0);
    const unpacked = numberOrString.unpack(numberValue);
    expect(unpacked).toEqual({ tag: "1", value: 0 });
  });
  test("should correctly pack a number", () => {
    const packed = numberOrString.pack({ tag: "1", value: 10 });
    expect(packed).toEqual(vNumber(10));
  });

  test("should correctly pack a string", () => {
    const packed = numberOrString.pack({ tag: "2", value: "hello" });
    expect(packed).toEqual(vString("hello"));
  });

  test("type should return the correct name", () => {
    expect(numberOrString.type.toString()).toBe("Number|String");
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

describe("frTagged", () => {
  const frTaggedNumber = frTagged(frNumber);

  test("Unpack Non-Tagged Item", () => {
    const value = vNumber(10);
    const unpacked = frTaggedNumber.unpack(value);
    expect(unpacked).toEqual({ value: 10, tags: new ValueTags({}) });
  });

  test("Unpack Tagged Item", () => {
    const taggedValue = vNumber(10).mergeTags({ name: vString("test") });
    const unpacked = frTaggedNumber.unpack(taggedValue);
    expect(unpacked).toEqual({
      value: 10,
      tags: new ValueTags({ name: vString("test") }),
    });
  });

  test("Pack", () => {
    const packed = frTaggedNumber.pack({
      value: 10,
      tags: new ValueTags({ name: vString("myName") }),
    });
    expect(packed).toEqual(vNumber(10).mergeTags({ name: vString("myName") }));
  });

  test("toString", () => {
    expect(frTaggedNumber.type.toString()).toBe("Number");
  });
});

describe("tDistOrNumber", () => {
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

describe("frDist", () => {
  test("base", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(frDist.unpack(value)).toBe(dist);
    expect(frDist.pack(dist)).toEqual(value);
  });

  test("symbolicDist", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(frSymbolicDist.unpack(value)).toBe(dist);
    expect(frSymbolicDist.pack(dist)).toEqual(value);
  });

  test("sampleSetDist", () => {
    const dResult = SampleSetDist.make([1, 2, 3, 4, 2, 1, 2, 3, 4, 5, 3, 4]);
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(frSampleSetDist.unpack(value)).toBe(dist);
    expect(frSampleSetDist.pack(dist)).toEqual(value);
  });

  test("pointSetDist", () => {
    const dist = new PointSetDist(
      new MixedShape({
        continuous: new ContinuousShape({ xyShape: { xs: [], ys: [] } }),
        discrete: new DiscreteShape({ xyShape: { xs: [], ys: [] } }),
      })
    );
    const value = vDist(dist);
    expect(frPointSetDist.unpack(value)).toBe(dist);
    expect(frPointSetDist.pack(dist)).toEqual(value);
  });
});
