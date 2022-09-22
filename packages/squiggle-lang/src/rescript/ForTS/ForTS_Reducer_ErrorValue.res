@genType type reducerErrorValue = Reducer_ErrorValue.errorValue //alias
@genType type reducerErrorValueWithSource = Reducer_ErrorValue.errorValueWithSource //alias
@genType type syntaxErrorLocation = Reducer_ErrorValue.syntaxErrorLocation //alias

@genType
let toString = (e: reducerErrorValueWithSource): string => Reducer_ErrorValue.errorToString(e.error)

@genType
let getLocation = (e: reducerErrorValueWithSource): option<syntaxErrorLocation> =>
  switch e.error {
  | RESyntaxError(_, optionalLocation) => optionalLocation
  | _ => None
  }

@genType
let createTodoError = (v: string) => Reducer_ErrorValue.RETodo(v)

@genType
let createOtherError = (v: string) => Reducer_ErrorValue.REOther(v)

@genType
let getErrorSource = (err: reducerErrorValueWithSource) => err.sourceId
