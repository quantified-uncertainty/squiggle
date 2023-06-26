import { AST, parse as astParse } from "../ast/parse.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { SqCompileError } from "./SqError.js";

export function parse(squiggleString: string): result<AST, SqCompileError> {
  const parseResult = astParse(squiggleString, "main");
  return Result.errMap(parseResult, (error) => new SqCompileError(error));
}
