@module("./ReducerProject_IncludeParser.js")
external parse__: string => array<array<string>> = "parse"

let parseIncludes = (expr: string): result<array<(string, string)>, SqError.t> =>
  try {
    let answer = parse__(expr)
    // let logEntry = answer->Js.Array2.joinWith(",")
    // `parseIncludes: ${logEntry} for expr: ${expr}`->Js.log
    E.A.fmap(answer, item => (item[0], item[1]))->Ok
  } catch {
  | Js.Exn.Error(obj) =>
    RESyntaxError(Belt.Option.getExn(Js.Exn.message(obj)))
    ->SqError.fromMessageWithFrameStack(
      Reducer_FrameStack.makeSingleFrameStack(Reducer_Peggy_Parse.syntaxErrorToLocation(obj)),
    )
    ->Error
  }
