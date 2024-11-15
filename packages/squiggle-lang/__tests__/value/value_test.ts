import { vArray, vNumber, vString } from "../../src/value/index.js";

test("toString", () => {
  expect(vNumber(1).toString()).toEqual("1");
  expect(vString("a").toString()).toEqual('"a"');
});

describe("VArray", () => {
  test("VArray.toString", () => {
    expect(vArray([vNumber(1), vString("a")]).toString()).toEqual('[1, "a"]');
  });

  test("long VArray.toString", () => {
    expect(
      vArray(Array.from({ length: 100 }, (_, i) => vNumber(i))).toString()
    ).toEqual(
      "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ... 78 more ..., 99]"
    );
  });
});

// TODO - more tests
