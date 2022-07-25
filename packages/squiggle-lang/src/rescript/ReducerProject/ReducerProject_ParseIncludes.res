@module("./ReducerProject_IncludeParser.js") external parse__: string => array<string> = "parse"

let parseIncludes = (expr: string): array<string> =>
  try {
    parse__(expr)
  } catch {
  | Js.Exn.Error(_obj) => []
  }
