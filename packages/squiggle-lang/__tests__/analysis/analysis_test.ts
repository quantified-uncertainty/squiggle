import { analyzeStringToTypedAst } from "../helpers/compileHelpers.js";

// This tests one particular case, `parent` on `InfixCall` nodes.
// Any node constructor can miss `this._init()` and cause problems with
// `parent`, but testing all nodes would be too annoying.
test("parent node", () => {
  const typedAstR = analyzeStringToTypedAst("2 + 2");
  expect(typedAstR.ok).toBe(true);

  const typedAst = (typedAstR as Extract<typeof typedAstR, { ok: true }>).value;

  expect(typedAst.parent).toBe(null);
  expect(typedAst.result?.parent).toBe(typedAst);
});

function returnType(code: string) {
  const typedAstR = analyzeStringToTypedAst(code);
  if (!typedAstR.ok) {
    throw new Error(typedAstR.value.toString({ withLocation: true }));
  }

  const typedAst = (typedAstR as Extract<typeof typedAstR, { ok: true }>).value;

  return typedAst.result?.type.display();
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

  test("builtin constants", () => {
    expect(returnType("Math.pi")).toBe("Number");
  });

  test("builtin functions", () => {
    expect(returnType("System.sampleCount")).toBe("() => Number");
  });

  test("function calls", () => {
    expect(returnType("System.sampleCount()")).toBe("Number");
  });

  test("function output type based on polymorphic end expression", () => {
    expect(
      returnType(`
{
  f(x) = x + 1
  f(1)
}`)
    ).toBe("Number|Dist|String"); // TODO - ideally, Squiggle should filter out `String` here.
  });

  test("polymorphic builtin functions", () => {
    expect(returnType("lognormal(1, 100)")).toBe("SampleSetDist");
  });
});
