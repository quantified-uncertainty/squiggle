import { typedAstNodeToString } from "../../src/analysis/toString.js";
import { assertTag, testRun } from "../helpers/helpers.js";

describe("SqValueContext", () => {
  test("valueAst for nested nodes", async () => {
    const { bindings } = await testRun(`
x = { foo: 5 }

y = 6
`);

    const x = bindings.get("x");
    assertTag(x, "Dict");
    expect(typedAstNodeToString(x.context!.valueAst, { pretty: false })).toBe(
      "(LetStatement :x (Dict (KeyValue 'foo' 5)))"
    );
    expect(x.context?.valueAstIsPrecise).toBe(true);

    const foo = x.value.get("foo");
    expect(
      typedAstNodeToString(foo!.context!.valueAst, { pretty: false })
    ).toBe("(KeyValue 'foo' 5)");
    expect(foo!.context!.valueAstIsPrecise).toBe(true);

    const y = bindings.get("y");
    assertTag(y, "Number");

    expect(typedAstNodeToString(y.context!.valueAst, { pretty: false })).toBe(
      "(LetStatement :y 6)"
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

    expect(typedAstNodeToString(z.context!.valueAst, { pretty: false })).toBe(
      "(LetStatement :z 5 (Decorator :name 'Z'))"
    );
  });
});
