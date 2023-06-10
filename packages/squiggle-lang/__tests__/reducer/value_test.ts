import { vNumber, vString, stringEscape } from "../../src/value/index.js";

describe("Value", () => {
  test("toString", () => {
    expect(vNumber(1).toString()).toEqual("1");
    expect(vString("a").toString()).toEqual("'a'");
  });
  test("stringEscape", () => {
    expect(stringEscape(`""'""''""""""''""`)).toEqual(
      `'""' + "'" + '""' + "''" + '""""""' + "''" + '""'`
    );
    expect(stringEscape(`'test'`)).toEqual(`"'test'"`);
    expect(stringEscape(`"test"`)).toEqual(`'"test"'`);
  });
});
