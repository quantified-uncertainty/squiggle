import * as prettier from "prettier";

async function format(code: string) {
  return await prettier.format(code, {
    parser: "squiggle",
    plugins: ["./src/index.ts"],
  });
}

describe("comments", () => {
  test("line comment", async () => {
    expect(
      await format(`// line comment
123`)
    ).toBe(`// line comment
123`);
  });

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
});

describe("expressions", () => {
  test("basic", async () => {
    expect(await format("2+2")).toBe("2 + 2");
  });

  test("nested", async () => {
    expect(await format("2+3*4")).toBe("2 + 3 * 4");
    expect(await format("(2+3)*4")).toBe("(2 + 3) * 4");
    expect(await format("2/3/4")).toBe("2 / 3 / 4");
    expect(await format("2/(3/4)")).toBe("2 / (3 / 4)");
  });

  test("complicated", async () => {
    expect(
      await format(`
    4 > (3 > 2 ? 3 : 5) && 2 == -(-1 + -3 -> {|x|x / 3}) ? "ok" : "not ok"
`)
    ).toBe(
      '4 > (3 > 2 ? 3 : 5) && 2 == -(-1 + -3 -> {|x|x / 3}) ? "ok" : "not ok"'
    );
  });
});

describe("records", () => {
  test("empty", async () => {
    expect(await format("{}")).toBe("{}");
  });

  test("one entry", async () => {
    expect(await format("{foo: 5}")).toBe("{ foo: 5 }");
  });

  test("simple string key", async () => {
    expect(await format('{"fooBar123": 5}')).toBe("{ fooBar123: 5 }");
  });

  test("string key with spaces", async () => {
    expect(await format('{"foo bar": 5}')).toBe('{ "foo bar": 5 }');
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

describe("arrays", () => {
  test("empty", async () => {
    expect(await format("[]")).toBe("[]");
    expect(await format("[   ]")).toBe("[]");
  });

  test("single item", async () => {
    expect(await format("[ 1   ]")).toBe("[1]");
  });

  test("multiple", async () => {
    expect(await format("[ 1, 3, 5   ]")).toBe("[1, 3, 5]");
  });

  test("multi-line", async () => {
    expect(
      await format(
        "[111111,222222,333333,444444,555555,666666,777777,888888,999999,1000000]"
      )
    ).toBe(
      `[
  111111,
  222222,
  333333,
  444444,
  555555,
  666666,
  777777,
  888888,
  999999,
  1000000,
]`
    );
  });
});

describe("ternary", () => {
  test("C-style", async () => {
    expect(await format("x = 3 > 4 ? 5 : 6")).toBe("x = 3 > 4 ? 5 : 6\n");
  });

  test("if-then-else", async () => {
    expect(await format("x = if 3 > 4 then 5 else 6")).toBe(
      "x = if 3 > 4 then 5 else 6\n"
    );
  });
});

describe("let", () => {
  test("simple", async () => {
    expect(await format("x = 5")).toBe("x = 5\n");
  });

  test("expression", async () => {
    expect(await format("x=5+6")).toBe("x = 5 + 6\n");
  });

  test("lambda", async () => {
    expect(await format("f={|x|x*x}")).toBe("f = {|x|x * x}\n");
  });

  test("lambda with multiple args", async () => {
    expect(await format("f={|x,y|x*y}")).toBe("f = {|x, y|x * y}\n");
  });

  test("defun", async () => {
    expect(await format("f(x)=x*x")).toBe("f(x) = x * x\n");
  });

  test("defun with multiple args", async () => {
    expect(await format("f(x,y)=x*y")).toBe("f(x, y) = x * y\n");
  });
});

describe("pipes", () => {
  test("simple", async () => {
    expect(await format("5->pointMass")).toBe("5 -> pointMass");
  });

  test("with args", async () => {
    expect(await format("5->add(6)")).toBe("5 -> add(6)");
  });

  test("complex", async () => {
    expect(
      await format(
        "pipe = 5 -> f1 -> f2() -> f3(1) -> {f: f2}.f2 -> {foo: f3}.foo(1)"
      )
    ).toBe(
      "pipe = 5 -> f1 -> f2 -> f3(1) -> { f: f2 }.f2 -> { foo: f3 }.foo(1)\n"
    );
  });
});
