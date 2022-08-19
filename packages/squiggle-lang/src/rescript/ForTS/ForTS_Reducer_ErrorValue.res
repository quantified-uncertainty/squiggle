open ForTS__Types

@genType
let toString = (e: reducerErrorValue): string => Reducer_ErrorValue.errorToString(e)

@genType
let getLocation = (e: reducerErrorValue): option<syntaxErrorLocation> =>
  switch e {
  | RESyntaxError(_, optionalLocation) => optionalLocation
  | _ => None
  }
