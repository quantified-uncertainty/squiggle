import { format } from "./helpers.js";

describe("dicts", () => {
  test("empty", async () => {
    expect(await format("{}")).toBe("{}");
  });

  test("one entry", async () => {
    expect(await format("{foo: 5}")).toBe("{ foo: 5 }");
  });

  test("shorthand", async () => {
    expect(await format("{foo, bar: bar, baz}")).toBe("{ foo, bar: bar, baz }");
  });

  test("simple string key", async () => {
    expect(await format('{"fooBar123": 5}')).toBe("{ fooBar123: 5 }");
  });

  test("string key with spaces", async () => {
    expect(await format('{"foo bar": 5}')).toBe('{ "foo bar": 5 }');
  });

  test("capitalized key", async () => {
    expect(await format('{"FooBar": 5}')).toBe('{ "FooBar": 5 }');
  });

  test("one line if possible", async () => {
    expect(
      await format(`{
      foo: 5,
    bar: 6}`)
    ).toBe("{ foo: 5, bar: 6 }");
  });

  test("multiline", async () => {
    expect(
      await format(
        `{ fooqweqweqweqweqw: 5, bar231qweqweqweqweqewqe: 6, adfaweraerqweqweqweqqweqwqeqe: 7}`
      )
    ).toBe(
      `{
  fooqweqweqweqweqw: 5,
  bar231qweqweqweqweqewqe: 6,
  adfaweraerqweqweqweqqweqwqeqe: 7,
}`
    );
  });
});
