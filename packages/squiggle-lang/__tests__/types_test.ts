import { PointSetDist } from "../src/dists/PointSetDist.js";
import { SampleSetDist } from "../src/dists/SampleSetDist/index.js";
import { Normal } from "../src/dists/SymbolicDist/index.js";
import { ContinuousShape } from "../src/PointSet/Continuous.js";
import { DiscreteShape } from "../src/PointSet/Discrete.js";
import { MixedShape } from "../src/PointSet/Mixed.js";
import {
  tAny,
  tArray,
  tBool,
  tDate,
  tDict,
  tDictWithArbitraryKeys,
  tDist,
  tDistOrNumber,
  tDomain,
  tDuration,
  tInput,
  tNumber,
  tOr,
  tPlot,
  tPointSetDist,
  tSampleSetDist,
  tScale,
  tString,
  tSymbolicDist,
  tTableChart,
  tTuple,
  tWithTags,
} from "../src/types/index.js";
import { ImmutableMap } from "../src/utility/immutable.js";
import { SDate } from "../src/utility/SDate.js";
import { SDuration } from "../src/utility/SDuration.js";
import { NumericRangeDomain } from "../src/value/domain.js";
import {
  Value,
  vArray,
  vBool,
  vDate,
  vDict,
  vDist,
  vDomain,
  vDuration,
  vInput,
  vNumber,
  vPlot,
  vScale,
  vString,
  vTableChart,
} from "../src/value/index.js";
import { ValueTags } from "../src/value/valueTags.js";
import { Input } from "../src/value/VInput.js";
import { Plot } from "../src/value/VPlot.js";
import { Scale } from "../src/value/VScale.js";

test("frNumber", () => {
  const value = vNumber(5);
  expect(tNumber.unpack(value)).toBe(5);
  expect(tNumber.pack(5)).toEqual(value);
});

test("frString", () => {
  const value = vString("foo");
  expect(tString.unpack(value)).toBe("foo");
  expect(tString.pack("foo")).toEqual(value);
});

test("frBool", () => {
  const value = vBool(true);
  expect(tBool.unpack(value)).toBe(true);
  expect(tBool.pack(true)).toEqual(value);
});

test("frDate", () => {
  const date = SDate.now();
  const value = vDate(date);
  expect(tDate.unpack(value)).toBe(date);
  expect(tDate.pack(date)).toEqual(value);
});

test("frDuration", () => {
  const duration = SDuration.fromMs(1234);
  const value = vDuration(duration);
  expect(tDuration.unpack(value)).toBe(duration);
  expect(tDuration.pack(duration)).toEqual(value);
});

describe("frDistOrNumber", () => {
  test("number", () => {
    const number = 123;
    const value = vNumber(number);
    expect(tDistOrNumber.unpack(value)).toBe(number);
    expect(tDistOrNumber.pack(number)).toEqual(value);
  });

  test("dist", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      throw new Error();
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(tDistOrNumber.unpack(value)).toBe(dist);
    expect(tDistOrNumber.pack(dist)).toEqual(value);
  });
});

describe("frDist", () => {
  const dResult = Normal.make({ mean: 2, stdev: 5 });
  if (!dResult.ok) {
    throw new Error();
  }
  const dist = dResult.value;
  const value = vDist(dist);
  expect(tDist.unpack(value)).toBe(dist);
  expect(tDist.pack(dist)).toEqual(value);
});

test("symbolicDist", () => {
  const dResult = Normal.make({ mean: 2, stdev: 5 });
  if (!dResult.ok) {
    throw new Error();
  }
  const dist = dResult.value;
  const value = vDist(dist);
  expect(tSymbolicDist.unpack(value)).toBe(dist);
  expect(tSymbolicDist.pack(dist)).toEqual(value);
});

test("sampleSetDist", () => {
  const dResult = SampleSetDist.make([1, 2, 3, 4, 2, 1, 2, 3, 4, 5, 3, 4]);
  if (!dResult.ok) {
    throw new Error();
  }
  const dist = dResult.value;
  const value = vDist(dist);
  expect(tSampleSetDist.unpack(value)).toBe(dist);
  expect(tSampleSetDist.pack(dist)).toEqual(value);
});

test("pointSetDist", () => {
  const dist = new PointSetDist(
    new MixedShape({
      continuous: new ContinuousShape({ xyShape: { xs: [], ys: [] } }),
      discrete: new DiscreteShape({ xyShape: { xs: [], ys: [] } }),
    })
  );
  const value = vDist(dist);
  expect(tPointSetDist.unpack(value)).toBe(dist);
  expect(tPointSetDist.pack(dist)).toEqual(value);
});

test.todo("frLambda");

test("frTableChart", () => {
  const tableChart = { columns: [], data: [] };
  const value = vTableChart(tableChart);
  expect(tTableChart.unpack(value)).toBe(tableChart);
  expect(tTableChart.pack(tableChart)).toEqual(value);
});

test("frScale", () => {
  const scale: Scale = { method: { type: "linear" } };
  const value = vScale(scale);
  expect(tScale.unpack(value)).toBe(scale);
  expect(tScale.pack(scale)).toEqual(value);
});

test("frInput", () => {
  const input: Input = { name: "first", type: "text" };
  const value = vInput(input);
  expect(tInput.unpack(value)).toBe(input);
  expect(tInput.pack(input)).toEqual(value);
});

test("frPlot", () => {
  const plot: Plot = {
    type: "distributions",
    distributions: [],
    xScale: { method: { type: "linear" } },
    yScale: { method: { type: "linear" } },
    showSummary: false,
  };
  const value = vPlot(plot);
  expect(tPlot.unpack(value)).toBe(plot);
  expect(tPlot.pack(plot)).toEqual(value);
});

test("frDomain", () => {
  const domain = new NumericRangeDomain(0, 1);
  const value = vDomain(domain);
  expect(tDomain.unpack(value)).toBe(domain);
  expect(tDomain.pack(domain)).toEqual(value);
});

describe("frArray", () => {
  const arr = [3, 5, 6];
  const value = vArray(arr.map((i) => vNumber(i)));

  test("unpack number[]", () => {
    expect(tArray(tNumber).unpack(value)).toEqual(arr);
  });

  test("pack number[]", () => {
    expect(tArray(tNumber).pack(arr)).toEqual(value);
  });

  test("unpack any[]", () => {
    expect(tArray(tAny()).unpack(value)).toEqual([
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
    expect(tTuple(tNumber, tString).unpack(value)).toEqual(arr);
    expect(tTuple(tNumber, tString).pack(arr)).toEqual(value);
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
    const tuple = tTuple(tNumber, tString, tNumber, tNumber, tNumber);
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
  expect(tDictWithArbitraryKeys(tNumber).unpack(value)).toEqual(dict);
  expect(tDictWithArbitraryKeys(tNumber).pack(dict)).toEqual(value);
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
});

describe("frOr", () => {
  const frNumberOrString = tOr(tNumber, tString);

  describe("unpack", () => {
    test("should correctly unpack a number", () => {
      const numberValue = vNumber(10);
      const unpacked = frNumberOrString.unpack(numberValue);
      expect(unpacked).toEqual({ tag: "1", value: 10 });
    });

    test("should correctly unpack a string", () => {
      const stringValue = vString("hello");
      const unpacked = frNumberOrString.unpack(stringValue);
      expect(unpacked).toEqual({ tag: "2", value: "hello" });
    });

    test("should correctly unpack falsy value", () => {
      const numberValue = vNumber(0);
      const unpacked = frNumberOrString.unpack(numberValue);
      expect(unpacked).toEqual({ tag: "1", value: 0 });
    });
  });

  describe("pack", () => {
    test("should correctly pack a number", () => {
      const packed = frNumberOrString.pack({ tag: "1", value: 10 });
      expect(packed).toEqual(vNumber(10));
    });

    test("should correctly pack a string", () => {
      const packed = frNumberOrString.pack({ tag: "2", value: "hello" });
      expect(packed).toEqual(vString("hello"));
    });
  });

  describe("display", () => {
    test("should return the correct name", () => {
      expect(frNumberOrString.display()).toBe("Number|String");
    });
  });
});

describe("frWithTags", () => {
  const itemType = tNumber;
  const frTaggedNumber = tWithTags(itemType);

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

  test("Display", () => {
    expect(frTaggedNumber.display()).toBe("Number");
  });
});
