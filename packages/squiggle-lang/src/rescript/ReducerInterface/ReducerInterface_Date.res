module EV = ReducerInterface_InternalExpressionValue
type expressionValue = EV.expressionValue

let dispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [IEvDate(t)]) => EV.IEvString(DateTime.Date.toString(t))->Ok->Some
  | ("makeDateFromYear", [IEvNumber(year)]) =>
    switch DateTime.Date.makeFromYear(year) {
    | Ok(t) => EV.IEvDate(t)->Ok->Some
    | Error(e) => Reducer_ErrorValue.RETodo(e)->Error->Some
    }
  | ("dateFromNumber", [IEvNumber(f)]) => EV.IEvDate(DateTime.Date.fromFloat(f))->Ok->Some
  | ("toNumber", [IEvDate(f)]) => EV.IEvNumber(DateTime.Date.toFloat(f))->Ok->Some
  | ("subtract", [IEvDate(d1), IEvDate(d2)]) =>
    switch DateTime.Date.subtract(d1, d2) {
    | Ok(d) => EV.IEvTimeDuration(d)->Ok
    | Error(e) => Error(RETodo(e))
    }->Some
  | ("subtract", [IEvDate(d1), IEvTimeDuration(d2)]) =>
    EV.IEvDate(DateTime.Date.subtractDuration(d1, d2))->Ok->Some
  | ("add", [IEvDate(d1), IEvTimeDuration(d2)]) =>
    EV.IEvDate(DateTime.Date.addDuration(d1, d2))->Ok->Some
  | _ => None
  }
}
