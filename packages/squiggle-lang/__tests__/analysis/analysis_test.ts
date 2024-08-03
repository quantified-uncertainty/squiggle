import { parse } from "../../src/ast/parse.js";

// This tests one particular case, `parent` on `InfixCall` nodes.
// Any node constructor can miss `this._init()` and cause problems with
// `parent`, but testing all nodes would be too annoying.
test("parent node", () => {
  const ast = parse("2 + 2", "test");
  expect(ast.ok).toBe(true);
  const value = (ast as Extract<typeof ast, { ok: true }>).value;

  expect(value.parent).toBe(null);
  expect(value.result?.parent).toBe(ast.value);
});

function returnType(code: string) {
  const ast = parse(code, "test");
  if (!ast.ok) {
    throw ast.value;
  }
  return ast.value.result?.type.display();
}

describe("inference", () => {
  test("numbers", () => {
    expect(returnType("2")).toBe("Number");
  });

  test("strings", () => {
    expect(returnType("'foo'")).toBe("String");
  });

  test("booleans", () => {
    expect(returnType("true")).toBe("Bool");
  });

  test("blocks", () => {
    expect(returnType("{ x = 1; x }")).toBe("Number");
  });

  test("infix calls", () => {
    expect(returnType("2 + 2")).toBe("Number");
    expect(returnType("2 + (3 to 4)")).toBe("Dist");
  });

  test("let", () => {
    expect(returnType("x = 2; x")).toBe("Number");
    expect(returnType("x = 2; y = x; y")).toBe("Number");
  });

  test("dict with static keys", () => {
    expect(returnType("{ foo: 1 }")).toBe("{foo: Number}");
  });

  test("dict with dynamic keys", () => {
    expect(returnType("f() = 1; { f(): 1 }")).toBe("Dict(any)");
  });

  test("list", () => {
    expect(returnType("[1, 'foo']")).toBe("List(any)");
  });

  test.failing("list of numbers", () => {
    expect(returnType("[1, 2, 3]")).toBe("List(Number)");
  });

  test("lookup constant keys", () => {
    expect(returnType("d = { foo: 1 }; d.foo")).toBe("Number");
  });

  test("lookup non-existent key", () => {
    expect(() => returnType("{ foo: 1 }.bar")).toThrow(
      "Key bar doesn't exist in dict {foo: Number}"
    );
  });

  test.failing("builtin functions", () => {
    expect(returnType("System.sampleCount()")).toBe("Number");
  });
});
