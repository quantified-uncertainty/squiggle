import { PointSetDist } from "../../src/dist/PointSetDist.js";
import { SampleSetDist } from "../../src/dist/SampleSetDist/index.js";
import { Normal } from "../../src/dist/SymbolicDist.js";
import {
  frAny,
  frArray,
  frBool,
  frDate,
  frDict,
  frDictWithArbitraryKeys,
  frDist,
  frDistOrNumber,
  frDistPointset,
  frDistSymbolic,
  frDomain,
  frDuration,
  frInput,
  frNamed,
  frNumber,
  frOptional,
  frOr,
  frPlot,
  frSampleSetDist,
  frScale,
  frString,
  frTableChart,
  frTuple,
} from "../../src/library/registry/frTypes.js";
import { ContinuousShape } from "../../src/PointSet/Continuous.js";
import { DiscreteShape } from "../../src/PointSet/Discrete.js";
import { MixedShape } from "../../src/PointSet/Mixed.js";
import { ImmutableMap } from "../../src/utility/immutableMap.js";
import { SDate } from "../../src/utility/SDate.js";
import { SDuration } from "../../src/utility/SDuration.js";
import { NumericRangeDomain } from "../../src/value/domain.js";
import {
  Input,
  Plot,
  Scale,
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
  const date = SDate.now();
  const value = vDate(date);
  expect(frDate.unpack(value)).toBe(date);
  expect(frDate.pack(date)).toEqual(value);
});

test("frDuration", () => {
  const duration = SDuration.fromMs(1234);
  const value = vDuration(duration);
  expect(frDuration.unpack(value)).toBe(duration);
  expect(frDuration.pack(duration)).toEqual(value);
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

test("distSymbolic", () => {
  const dResult = Normal.make({ mean: 2, stdev: 5 });
  if (!dResult.ok) {
    throw new Error();
  }
  const dist = dResult.value;
  const value = vDist(dist);
  expect(frDistSymbolic.unpack(value)).toBe(dist);
  expect(frDistSymbolic.pack(dist)).toEqual(value);
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
  expect(frDistPointset.unpack(value)).toBe(dist);
  expect(frDistPointset.pack(dist)).toEqual(value);
});

test.todo("frLambda");

test("frTableChart", () => {
  const tableChart = { columns: [], data: [] };
  const value = vTableChart(tableChart);
  expect(frTableChart.unpack(value)).toBe(tableChart);
  expect(frTableChart.pack(tableChart)).toEqual(value);
});

test("frScale", () => {
  const scale: Scale = { type: "linear" };
  const value = vScale(scale);
  expect(frScale.unpack(value)).toBe(scale);
  expect(frScale.pack(scale)).toEqual(value);
});

test("frInput", () => {
  const input: Input = { name: "first", type: "text" };
  const value = vInput(input);
  expect(frInput.unpack(value)).toBe(input);
  expect(frInput.pack(input)).toEqual(value);
});

test("frPlot", () => {
  const plot: Plot = {
    type: "distributions",
    distributions: [],
    xScale: { type: "linear" },
    yScale: { type: "linear" },
    showSummary: false,
  };
  const value = vPlot(plot);
  expect(frPlot.unpack(value)).toBe(plot);
  expect(frPlot.pack(plot)).toEqual(value);
});

test("frDomain", () => {
  const domain = new NumericRangeDomain(0, 1);
  const value = vDomain(domain);
  expect(frDomain.unpack(value)).toBe(domain);
  expect(frDomain.pack(domain)).toEqual(value);
});

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

describe("frOr", () => {
  const frNumberOrString = frOr(frNumber, frString);

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

  describe("getName", () => {
    test("should return the correct name", () => {
      expect(frNumberOrString.getName()).toBe("Number|String");
    });
  });
});

describe("frNamed", () => {
  const testNumber = 42;
  const testValue: Value = vNumber(testNumber);
  const namedNumberType = frNamed("TestNumber", frNumber);

  test("Unpack", () => {
    expect(namedNumberType.unpack(testValue)).toBe(testNumber);
  });

  test("Pack", () => {
    expect(namedNumberType.pack(testNumber)).toEqual(testValue);
  });

  test("getName", () => {
    expect(namedNumberType).toBeDefined();
    expect(namedNumberType.getName()).toBe("TestNumber: Number");
  });

  test("getName with Optional Type", () => {
    const optionalNumberType = frOptional(frNumber);
    const namedOptionalNumberType = frNamed(
      "OptionalTestNumber",
      optionalNumberType
    );
    expect(namedOptionalNumberType.getName()).toBe(
      "OptionalTestNumber?: Number"
    );
  });
});
