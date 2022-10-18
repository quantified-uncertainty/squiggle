import * as RSParse from "../rescript/Reducer/Reducer_Peggy/Reducer_Peggy_Parse.gen";
import { result, resultMap2 } from "./types";
import { AnyPeggyNode } from "../rescript/Reducer/Reducer_Peggy/helpers";
import { SqLocation } from "./SqError";

export class SqParseError {
  constructor(private _value: RSParse.ParseError_t) {}

  getMessage() {
    return RSParse.ParseError_getMessage(this._value);
  }

  getLocation(): SqLocation {
    return RSParse.ParseError_getLocation(this._value);
  }
}

export function parse(
  squiggleString: string
): result<AnyPeggyNode, SqParseError> {
  const parseResult = RSParse.parse(squiggleString, "main");
  return resultMap2(
    parseResult,
    (ast) => ast as AnyPeggyNode,
    (error: RSParse.ParseError_t) => new SqParseError(error)
  );
}
