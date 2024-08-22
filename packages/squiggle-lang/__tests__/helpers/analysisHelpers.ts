import { analyzeAst } from "../../src/analysis/index.js";
import { TypedAST } from "../../src/analysis/types.js";
import { parse } from "../../src/ast/parse.js";
import { ICompileError } from "../../src/errors/IError.js";
import { bind, result } from "../../src/utility/result.js";

export function analyzeStringToTypedAst(
  code: string,
  name = "test"
): result<TypedAST, ICompileError> {
  return bind(parse(code, name), (ast) => analyzeAst(ast));
}

export function returnType(code: string) {
  const typedAstR = analyzeStringToTypedAst(code);
  if (!typedAstR.ok) {
    throw new Error(typedAstR.value.toString({ withLocation: true }));
  }

  const typedAst = (typedAstR as Extract<typeof typedAstR, { ok: true }>).value;

  return typedAst.result?.type.toString();
}
