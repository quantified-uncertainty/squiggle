import { SqError } from "../SqError";
import { Error_, Ok, result } from "../types";
import { parse } from "./IncludeParser";
import * as RSReducerPeggyParse from "../../rescript/Reducer/Reducer_Peggy/Reducer_Peggy_Parse.gen";
import * as RSError from "../../rescript/SqError.gen";

type PeggySyntaxError = {
  message: string;
  location: RSReducerPeggyParse.location;
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
        RSError.fromParseError(
          RSReducerPeggyParse.ParseError_make(
            peggyError.message,
            peggyError.location
          )
        )
      )
    );
  }
};
