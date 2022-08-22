@genType.opaque type result_<'a, 'e> = result<'a, 'e>
@genType type result<'a, 'e> = result_<'a, 'e> // alias and re-export

@genType let isError = (r: result_<'a, 'e>): bool => Belt.Result.isError(r)
@genType let isOk = (r: result_<'a, 'e>): bool => Belt.Result.isOk(r)

@genType
let getError = (r: result_<'a, 'e>): option<'e> =>
  switch r {
  | Ok(_) => None
  | Error(e) => Some(e)
  }

@genType
let getValue = (r: result<'a, 'e>): option<'a> =>
  switch r {
  | Ok(v) => Some(v)
  | Error(_) => None
  }

@module("ForTS_Result_tag") @scope("resultTag")
external rtOk_: int = "RtOk"

@module("ForTS_Result_tag") @scope("resultTag")
external rtError_: int = "RtError"

@genType.import("./ForTS_Result_tag")
type resultTag

external castEnum: int => resultTag = "%identity"

@genType
let getTag = (r: result<'a, 'e>): resultTag =>
  switch r {
  | Ok(_) => rtOk_->castEnum
  | Error(_) => rtError_->castEnum
  }

@genType
let fmap = (r: result<'a, 'e>, f: 'a => 'b): result<'b, 'e> =>
  switch r {
  | Ok(v) => Ok(f(v))
  | Error(e) => Error(e)
  }
