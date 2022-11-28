import { LocationRange } from "peggy";
import { ParseError, parse as astParse, AST } from "../ast/parse";
import { fromRSResult, result, resultMap2 } from "./types";

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
  const parseResult = fromRSResult(astParse(squiggleString, "main"));
  return resultMap2(
    parseResult,
    (ast) => ast,
    (error: ParseError) => new SqParseError(error)
  );
}
