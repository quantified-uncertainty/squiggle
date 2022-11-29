import { LocationRange } from "peggy";
import { ParseError, parse as astParse, AST } from "../ast/parse";
import * as Result from "../utility/result";
import { result } from "../utility/result";

export class SqParseError {
  constructor(private _value: ParseError) {}

  getMessage() {
    return this._value.message;
  }

  getLocation(): LocationRange {
    return this._value.location;
  }
}

export function parse(squiggleString: string): result<AST, SqParseError> {
  const parseResult = astParse(squiggleString, "main");
  return Result.fmap2(
    parseResult,
    (ast) => ast,
    (error: ParseError) => new SqParseError(error)
  );
}
