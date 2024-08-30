import {
  FormatterOptions,
  make,
  makeAndToString,
} from "../../src/utility/FormattedNumber.js";

describe("FormattedNumber", () => {
  const makeTestCases: [number, ReturnType<typeof make>][] = [
    [123.45, { type: "basic", value: "120", isNegative: false }],
    [-123.45, { type: "basic", value: "120", isNegative: true }],
    [1234, { type: "basic", value: "1200", isNegative: false }],
    [
      1234567,
      { type: "unit", mantissa: "1.2", symbol: "M", isNegative: false },
    ],
    [0, { type: "basic", value: "0", isNegative: false }],
    [Infinity, { type: "basic", value: "Infinity", isNegative: false }],
    [
      0.0000001,
      { type: "scientific", mantissa: "1", exponent: -7, isNegative: false },
    ],
    [
      1e20,
      { type: "scientific", mantissa: "1", exponent: 20, isNegative: false },
    ],
    [-Infinity, { type: "basic", value: "Infinity", isNegative: true }],
    [NaN, { type: "basic", value: "NaN", isNegative: false }],
  ];

  const makeWithOptionsTestCases: [
    number,
    FormatterOptions,
    ReturnType<typeof make>,
  ][] = [
    [
      123.45,
      { precision: 1 },
      { type: "basic", value: "100", isNegative: false },
    ],
    [
      1234567,
      { precision: 3 },
      { type: "unit", mantissa: "1.23", symbol: "M", isNegative: false },
    ],
    [
      0.0001,
      { forceScientific: true },
      { type: "scientific", mantissa: "1", exponent: -4, isNegative: false },
    ],
    [
      1000,
      { forceScientific: true },
      { type: "basic", value: "1000", isNegative: false },
    ],
    [
      1,
      { forceScientific: true },
      { type: "basic", value: "1", isNegative: false },
    ],
    [
      9876,
      { precision: 4 },
      { type: "basic", value: "9876", isNegative: false },
    ],
  ];

  const makeAndToStringTestCases = [
    [1, "1"],
    [123.45, "120"],
    [-123.45, "-120"],
    [1234, "1200"],
    [1234567, "1.2M"],
    [0, "0"],
    [Infinity, "Infinity"],
    [0.0000001, "1e-7"],
    [1e20, "1e20"],
    [-Infinity, "-Infinity"],
    [NaN, "NaN"],
  ];

  describe("make", () => {
    test.each(makeTestCases)("make(%p) -> %p", (input, expected) => {
      expect(make(input)).toEqual(expected);
    });

    test.each(makeWithOptionsTestCases)(
      "make(%p, %p) -> %p",
      (input, options, expected) => {
        expect(make(input, options)).toEqual(expected);
      }
    );
  });

  describe("makeAndToString", () => {
    test.each(makeAndToStringTestCases)(
      "makeAndToString(%p) -> %p",
      (input, expected) => {
        expect(makeAndToString(input as number)).toBe(expected);
      }
    );
  });
});
