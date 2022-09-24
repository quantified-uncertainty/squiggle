@genType type reducerError = Reducer_ErrorValue.error //alias
@genType type reducerErrorValue = Reducer_ErrorValue.errorValue //alias
@genType type location = Reducer_ErrorValue.location //alias

@genType
let toString = (e: reducerError): string => Reducer_ErrorValue.errorToString(e)

@genType
let getLocation = (e: reducerError): option<location> =>
  switch e.stackTrace {
  | Some(stack) => Some(stack.location)
  | None => None
  }

@genType
let createOtherError = (v: string): reducerError =>
  Reducer_ErrorValue.REOther(v)->Reducer_ErrorValue.attachEmptyStackTraceToErrorValue

@genType
let attachEmptyStackTraceToErrorValue = (v: reducerErrorValue): reducerError =>
  Reducer_ErrorValue.attachEmptyStackTraceToErrorValue(v)
