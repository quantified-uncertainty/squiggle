@genType type reducerErrorValue = Reducer_ErrorValue.errorValue //alias
@genType type syntaxErrorLocation = Reducer_ErrorValue.syntaxErrorLocation //alias

@genType
let toString = (e: reducerErrorValue): string => Reducer_ErrorValue.errorToString(e)

@genType
let getLocation = (e: reducerErrorValue): option<syntaxErrorLocation> =>
  switch e {
  | RESyntaxError(_, optionalLocation) => optionalLocation
  | _ => None
  }

@genType
let createTodoError = (v: string) => Reducer_ErrorValue.RETodo(v)

@genType
let createOtherError = (v: string) => Reducer_ErrorValue.REOther(v)
