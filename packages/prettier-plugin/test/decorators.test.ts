import { format } from "./helpers.js";

describe("decorators", () => {
  test("basic", async () => {
    expect(
      await format(`
@foo
@bar(1,2)
@baz
x=5`)
    ).toBe(`@foo
@bar(1, 2)
@baz
x = 5`);
  });

  test("multiline arguments", async () => {
    expect(
      await format(`
@foo
@bar("aweuyraiuweyrlaiuewyriaweyari1","aweuyraiuweyrlaiuewyriaweyari2","aweuyraiuweyrlaiuewyriaweyari3")
@baz
x=5`)
    ).toBe(`@foo
@bar(
  "aweuyraiuweyrlaiuewyriaweyari1",
  "aweuyraiuweyrlaiuewyriaweyari2",
  "aweuyraiuweyrlaiuewyriaweyari3"
)
@baz
x = 5`);
  });

  test("on functions", async () => {
    expect(
      await format(`
@foo
@bar(1,2)
@baz
f(x)=x`)
    ).toBe(`@foo
@bar(1, 2)
@baz
f(x) = x`);
  });
});
