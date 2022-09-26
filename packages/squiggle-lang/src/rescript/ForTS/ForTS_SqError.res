@genType type error = SqError.Error.t //alias
@genType type errorMessage = SqError.Message.t //alias
@genType type location = Reducer_Peggy_Parse.location //alias

@genType
let toString = (e: error): string => SqError.Error.toString(e)

@genType
let getLocation = (e: error): option<location> =>
  switch e.stackTrace {
  | Some(stack) => Some(stack.location)
  | None => None
  }

@genType
let createOtherError = (v: string): error => SqError.Message.REOther(v)->SqError.Error.fromMessage

@genType
let errorFromMessage = (v: errorMessage): error => v->SqError.Error.fromMessage
