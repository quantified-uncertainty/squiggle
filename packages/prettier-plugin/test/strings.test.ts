import { format } from "./helpers.js";

describe("strings", () => {
  test("simple string", async () => {
    expect(await format(`"foo"`)).toBe(`"foo"`);
  });

  test("single quote string", async () => {
    expect(await format(`'foo'`)).toBe(`"foo"`);
  });

  test("single quote string with double quote inside", async () => {
    expect(await format(`'foo: "bar"'`)).toBe(`"foo: \\"bar\\""`);
  });

  // https://github.com/quantified-uncertainty/squiggle/issues/2207
  test("string with escaped characters", async () => {
    expect(await format(`"This is something \\" \\' \\" else"`)).toBe(
      `"This is something \\" ' \\" else"`
    );
  });

  // https://github.com/quantified-uncertainty/squiggle/issues/2281
  test("multiline string", async () => {
    expect(
      await format(`
'foo\t"foo2"
bar'
`)
    ).toBe(`"foo\\t\\"foo2\\"
bar"`);
  });
});
