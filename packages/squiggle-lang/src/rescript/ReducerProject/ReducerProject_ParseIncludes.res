@module("./ReducerProject_IncludeParser.js") external parse__: string => array<string> = "parse"

let parseIncludes = (expr: string): result<array<string>, Reducer_ErrorValue.errorValue> =>
  try {
    let answer = parse__(expr)
    // let logEntry = answer->Js.Array2.joinWith(",")
    // `parseIncludes: ${logEntry} for expr: ${expr}`->Js.log
    answer->Ok
  } catch {
  | Js.Exn.Error(obj) =>
    RESyntaxError(
      Belt.Option.getExn(Js.Exn.message(obj)),
      Reducer_Peggy_Parse.syntaxErrorToLocation(obj)->Some,
    )->Error
  }
