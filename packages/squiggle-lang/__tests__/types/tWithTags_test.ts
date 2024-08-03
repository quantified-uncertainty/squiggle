import { tNumber, tWithTags } from "../../src/types";
import { vNumber, vString } from "../../src/value";
import { ValueTags } from "../../src/value/valueTags";

const tTaggedNumber = tWithTags(tNumber);

test("Unpack Non-Tagged Item", () => {
  const value = vNumber(10);
  const unpacked = tTaggedNumber.unpack(value);
  expect(unpacked).toEqual({ value: 10, tags: new ValueTags({}) });
});

test("Unpack Tagged Item", () => {
  const taggedValue = vNumber(10).mergeTags({ name: vString("test") });
  const unpacked = tTaggedNumber.unpack(taggedValue);
  expect(unpacked).toEqual({
    value: 10,
    tags: new ValueTags({ name: vString("test") }),
  });
});

test("Pack", () => {
  const packed = tTaggedNumber.pack({
    value: 10,
    tags: new ValueTags({ name: vString("myName") }),
  });
  expect(packed).toEqual(vNumber(10).mergeTags({ name: vString("myName") }));
});

test("Display", () => {
  expect(tTaggedNumber.display()).toBe("Number");
});
