import {
  tArray,
  tBool,
  tDate,
  tNumber,
  tString,
} from "../../src/types/index.js";
import { SDate } from "../../src/utility/SDate.js";
import {
  vArray,
  vBool,
  vDate,
  vNumber,
  vString,
} from "../../src/value/index.js";

describe("tString", () => {
  test("check", () => {
    expect(tString.check(vString("foo"))).toBe(true);
    expect(tString.check(vBool(true))).toBe(false);
  });
});

describe("tArray", () => {
  test("check number[]", () => {
    expect(tArray(tNumber).check(vArray([vNumber(3), vNumber(5)]))).toBe(true);
  });

  test("check number[] fail", () => {
    expect(tArray(tNumber).check(vArray([vNumber(3), vString("foo")]))).toBe(
      false
    );
  });

  test("nested check", () => {
    expect(
      tArray(tArray(tNumber)).check(vArray([vArray([vNumber(3), vNumber(5)])]))
    ).toBe(true);
    expect(
      tArray(tArray(tNumber)).check(vArray([vNumber(3), vNumber(5)]))
    ).toBe(false);
  });
});

describe("tBool", () => {
  test("check", () => {
    expect(tBool.check(vBool(true))).toBe(true);
    expect(tBool.check(vBool(false))).toBe(true);
    expect(tBool.check(vString("true"))).toBe(false);
  });
});

describe("tDate", () => {
  test("check", () => {
    expect(tDate.check(vDate(SDate.now()))).toBe(true);
  });
});
