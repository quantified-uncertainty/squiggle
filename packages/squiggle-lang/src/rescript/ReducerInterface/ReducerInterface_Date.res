module T = Reducer_T

let dispatch = (
  call: ReducerInterface_InternalExpressionValue.functionCall,
  _: GenericDist.env,
): option<result<T.value, Reducer_ErrorValue.errorValue>> => {
  switch call {
  | ("toString", [IEvDate(t)]) => T.IEvString(DateTime.Date.toString(t))->Ok->Some
  | ("makeDateFromYear", [IEvNumber(year)]) =>
    switch DateTime.Date.makeFromYear(year) {
    | Ok(t) => T.IEvDate(t)->Ok->Some
    | Error(e) => Reducer_ErrorValue.RETodo(e)->Error->Some
    }
  | ("dateFromNumber", [IEvNumber(f)]) => T.IEvDate(DateTime.Date.fromFloat(f))->Ok->Some
  | ("toNumber", [IEvDate(f)]) => T.IEvNumber(DateTime.Date.toFloat(f))->Ok->Some
  | ("subtract", [IEvDate(d1), IEvDate(d2)]) =>
    switch DateTime.Date.subtract(d1, d2) {
    | Ok(d) => T.IEvTimeDuration(d)->Ok
    | Error(e) => Error(RETodo(e))
    }->Some
  | ("subtract", [IEvDate(d1), IEvTimeDuration(d2)]) =>
    T.IEvDate(DateTime.Date.subtractDuration(d1, d2))->Ok->Some
  | ("add", [IEvDate(d1), IEvTimeDuration(d2)]) =>
    T.IEvDate(DateTime.Date.addDuration(d1, d2))->Ok->Some
  | _ => None
  }
}
