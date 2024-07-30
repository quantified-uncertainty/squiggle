import { parse } from "../../src/ast/parse.js";

// This tests one particular case, `parent` on `InfixCall` nodes.
// Any node constructor can miss `this._init()` and cause problems with
// `parent`, but testing all nodes would be too annoying.
test("parent node", () => {
  const ast = parse("2 + 2", "test");
  expect((ast.value as any).result.parent).toBe(ast.value);
});
