import { LocationRange } from "peggy";
import { makeParseError } from "../../ast/parse";
import { fromParseError } from "../../reducer/IError";
import { SqError } from "../SqError";
import { Error_, Ok, result } from "../types";
import { parse } from "./IncludeParser";

type PeggySyntaxError = {
  message: string;
  location: LocationRange;
};

export const parseIncludes = (
  expr: string
): result<[string, string][], SqError> => {
  try {
    const answer: string[][] = parse(expr);
    // let logEntry = answer->Js.Array2.joinWith(",")
    // `parseIncludes: ${logEntry} for expr: ${expr}`->Js.log
    return Ok(answer.map((item) => [item[0], item[1]]));
  } catch (e: unknown) {
    const peggyError = e as PeggySyntaxError;
    return Error_(
      new SqError(
        fromParseError(makeParseError(peggyError.message, peggyError.location))
      )
    );
  }
};
