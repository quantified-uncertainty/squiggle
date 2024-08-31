import { analyzeAst, TypedASTResult } from "../../src/analysis/index.js";
import { parse } from "../../src/ast/parse.js";
import { bind } from "../../src/utility/result.js";

export function analyzeStringToTypedAst(
  code: string,
  name = "test"
): TypedASTResult {
  return bind(parse(code, name), (ast) => analyzeAst(ast));
}

export function returnType(code: string) {
  const typedAstR = analyzeStringToTypedAst(code);
  if (!typedAstR.ok) {
    throw new Error(
      typedAstR.value.map((e) => e.toString({ withLocation: true })).join("\n")
    );
  }

  const typedAst = (typedAstR as Extract<typeof typedAstR, { ok: true }>).value;

  return typedAst.result?.type.toString();
}
