import { parse as astParse } from "../ast/parse.js";
import { AST } from "../ast/types.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { SqCompileError } from "./SqError.js";

export function parse(squiggleString: string): result<AST, SqCompileError[]> {
  const parseResult = astParse(squiggleString, "main");
  return Result.errMap(parseResult, (errors) =>
    errors.map((error) => new SqCompileError(error))
  );
}
