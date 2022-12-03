import { LocationRange } from "peggy";
import { makeParseError } from "../../ast/parse";
import { IError } from "../../reducer/IError";
import { SqError } from "../SqError";
import * as Result from "../../utility/result";
import { parse } from "./IncludeParser";

type PeggySyntaxError = {
  message: string;
  location: LocationRange;
};

export const parseIncludes = (
  expr: string
): Result.result<[string, string][], SqError> => {
  try {
    const answer: string[][] = parse(expr);
    // let logEntry = answer->Js.Array2.joinWith(",")
    // `parseIncludes: ${logEntry} for expr: ${expr}`->Js.log
    return Result.Ok(answer.map((item) => [item[0], item[1]]));
  } catch (e: unknown) {
    const peggyError = e as PeggySyntaxError;
    return Result.Error(
      new SqError(
        IError.fromParseError(
          makeParseError(peggyError.message, peggyError.location)
        )
      )
    );
  }
};
