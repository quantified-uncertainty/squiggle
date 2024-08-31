import { analyzeStringToTypedAst } from "../helpers/analysisHelpers.js";

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
