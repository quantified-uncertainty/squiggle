import { TypedAST } from "../analysis/types.js";
import { parse as astParse } from "../ast/parse.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { SqCompileError } from "./SqError.js";

export function parse(
  squiggleString: string
): result<TypedAST, SqCompileError> {
  const parseResult = astParse(squiggleString, "main");
  return Result.errMap(parseResult, (error) => new SqCompileError(error));
}
