import * as prettier from "prettier";

function format(code: string) {
  return prettier.format(code, {
    parser: "squiggle",
    plugins: ["."],
  });
}

describe("comments", () => {
  test("line comment", () => {
    expect(
      format(`// line comment
123`)
    ).toBe(`// line comment
123`);
  });

  test("comment indentation is ignored", () => {
    expect(
      format(`   // line comment
123`)
    ).toBe(`// line comment
123`);
  });

  test("double line comment", () => {
    expect(
      format(`// first line
// second line
123`)
    ).toBe(
      `// first line
// second line
123`
    );
  });
  test("comment before and after value", () => {
    expect(
      format(`// first line
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
  test("basic", () => {
    expect(format("2+2")).toBe("2 + 2");
  });

  test("nested expressions add extra braces", () => {
    expect(format("2+3*4")).toBe("2 + (3 * 4)");
  });
  // should be, not implemented:
  test.failing("nested", () => {
    expect(format("2+3*4")).toBe("2 + 3 * 4");
  });
});

describe("records", () => {
  test("empty", () => {
    expect(format("{}")).toBe("{}");
  });

  test("one entry", () => {
    expect(format("{foo: 5}")).toBe("{ foo: 5 }");
  });

  test("simple string key", () => {
    expect(format('{"fooBar123": 5}')).toBe("{ fooBar123: 5 }");
  });

  test("string key with spaces", () => {
    expect(format('{"foo bar": 5}')).toBe('{ "foo bar": 5 }');
  });

  test("one line if possible", () => {
    expect(
      format(`{
      foo: 5,
    bar: 6}`)
    ).toBe("{ foo: 5, bar: 6 }");
  });

  test("multiline", () => {
    expect(
      format(
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
  test("empty", () => {
    expect(format("[]")).toBe("[]");
    expect(format("[   ]")).toBe("[]");
  });

  test("single item", () => {
    expect(format("[ 1   ]")).toBe("[1]");
  });

  test("multiple", () => {
    expect(format("[ 1, 3, 5   ]")).toBe("[1, 3, 5]");
  });

  test("multi-line", () => {
    expect(
      format(
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
  test("C-style", () => {
    expect(format("x = 3 > 4 ? 5 : 6")).toBe("x = 3 > 4 ? 5 : 6\n");
  });

  test("if-then-else", () => {
    expect(format("x = if 3 > 4 then 5 else 6")).toBe(
      "x = if 3 > 4 then 5 else 6\n"
    );
  });
});

describe("let", () => {
  test("simple", () => {
    expect(format("x = 5")).toBe("x = 5\n");
  });

  test("expression", () => {
    expect(format("x=5+6")).toBe("x = 5 + 6\n");
  });

  test("lambda", () => {
    expect(format("f={|x|x*x}")).toBe("f = {|x|x * x}\n");
  });

  test("lambda with multiple args", () => {
    expect(format("f={|x,y|x*y}")).toBe("f = {|x, y|x * y}\n");
  });

  test("defun", () => {
    expect(format("f(x)=x*x")).toBe("f(x) = x * x\n");
  });

  test("defun with multiple args", () => {
    expect(format("f(x,y)=x*y")).toBe("f(x, y) = x * y\n");
  });
});

describe("pipes", () => {
  test("simple", () => {
    expect(format("5->pointMass")).toBe("5 -> pointMass");
  });

  test("with args", () => {
    expect(format("5->add(6)")).toBe("5 -> add(6)");
  });

  test("complex", () => {
    expect(
      format(
        "pipe = 5 -> f1 -> f2() -> f3(1) -> {f: f2}.f2 -> {foo: f3}.foo(1)"
      )
    ).toBe(
      "pipe = 5 -> f1 -> f2 -> f3(1) -> ({ f: f2 }).f2 -> ({ foo: f3 }).foo(1)\n"
    );
  });
});
