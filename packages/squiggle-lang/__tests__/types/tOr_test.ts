import { tNumber, tOr, tString } from "../../src/types";
import { vNumber, vString } from "../../src/value";

const numberOrString = tOr(tNumber, tString);

describe("unpack", () => {
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
});

describe("pack", () => {
  test("should correctly pack a number", () => {
    const packed = numberOrString.pack({ tag: "1", value: 10 });
    expect(packed).toEqual(vNumber(10));
  });

  test("should correctly pack a string", () => {
    const packed = numberOrString.pack({ tag: "2", value: "hello" });
    expect(packed).toEqual(vString("hello"));
  });
});

describe("display", () => {
  test("should return the correct name", () => {
    expect(numberOrString.display()).toBe("Number|String");
  });
});
