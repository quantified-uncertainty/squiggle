import { nodeToString } from "../../src/ast/parse.js";
import { assertTag, testRun } from "../helpers/helpers.js";

describe("SqValueContext", () => {
  test("valueAst for nested nodes", async () => {
    const { bindings } = await testRun(`
x = { foo: 5 }

y = 6
`);

    const x = bindings.get("x");
    assertTag(x, "Dict");
    expect(nodeToString(x.context!.valueAst)).toBe(
      "(LetStatement :x (Block (Dict (KeyValue 'foo' 5))))"
    );
    expect(x.context?.valueAstIsPrecise).toBe(true);

    const foo = x.value.get("foo");
    expect(nodeToString(foo!.context!.valueAst)).toBe("(KeyValue 'foo' 5)");
    expect(foo!.context!.valueAstIsPrecise).toBe(true);

    const y = bindings.get("y");
    assertTag(y, "Number");

    expect(nodeToString(y.context!.valueAst)).toBe(
      "(LetStatement :y (Block 6))"
    );
    expect(y!.context!.valueAstIsPrecise).toBe(true);
  });

  test("valueAst for decorated statements", async () => {
    const { bindings } = await testRun(`
@name("Z")
z = 5
`);

    const z = bindings.get("z");
    assertTag(z, "Number");

    expect(nodeToString(z.context!.valueAst)).toBe(
      "(LetStatement :z (Block 5))"
    );
  });
});
