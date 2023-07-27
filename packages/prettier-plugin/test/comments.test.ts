import { format } from "./helpers.js";

describe("comments", () => {
  test("line comment", async () => {
    expect(
      await format(`// line comment
123`)
    ).toBe(`// line comment
123`);
  }, 20000); // first call to prettier is slow and occasionally causes timeouts in Github Actions

  test("comment indentation is ignored", async () => {
    expect(
      await format(`   // line comment
123`)
    ).toBe(`// line comment
123`);
  });

  test("double line comment", async () => {
    expect(
      await format(`// first line
// second line
123`)
    ).toBe(
      `// first line
// second line
123`
    );
  });
  test("comment before and after value", async () => {
    expect(
      await format(`// first line
x = 5
// second line
123`)
    ).toBe(`// first line
x = 5
// second line
123`);
  });

  test("comment in block definition", async () => {
    expect(
      await format(`
foo = {
  // inner comment
  x = 5
  x*x
}
`)
    ).toBe(`foo = {
  // inner comment
  x = 5
  x * x
}
`);
  });

  test("comment in simple function definition", async () => {
    expect(
      await format(`
foo() = { /* inner comment */ 5 }
`)
    ).toBe(`foo() = { /* inner comment */ 5 }
`);
  });

  test("long comment in function definition", async () => {
    expect(
      await format(`
foo() = { /* long long long long long long long long long long long long inner comment */ 5 }
`)
    ).toBe(`foo() = {
  /* long long long long long long long long long long long long inner comment */ 5
}
`);
  });

  test("comment in function definition", async () => {
    expect(
      await format(`
foo(x) = {
  // inner comment
  x*x
}
`)
    ).toBe(`foo(x) = {
  // inner comment
  x * x
}
`);
  });

  test("comment in expression", async () => {
    expect(
      await format(`
x = 3 + /* comment */ 5
`)
    ).toBe(`x = 3 + /* comment */ 5
`);
  });

  test("trailing comment", async () => {
    expect(await format(`x = 5 // first line`)).toBe(`x = 5 // first line
`);
  });
});
