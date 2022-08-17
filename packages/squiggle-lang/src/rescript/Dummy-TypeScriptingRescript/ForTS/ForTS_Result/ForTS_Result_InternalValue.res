open ForTS_Types

@genType let isError = (r: result_internalValue): bool => Belt.Result.isError(r)
@genType let isOk = (r: result_internalValue): bool => Belt.Result.isOk(r)

@genType
let getError = (r: result_internalValue): option<errorValue> =>
  switch r {
  | Ok(_) => None
  | Error(e) => Some(e)
  }

@genType
let getValue = (r: result_internalValue): option<internalValue> =>
  switch r {
  | Ok(v) => Some(v)
  | Error(_) => None
  }
