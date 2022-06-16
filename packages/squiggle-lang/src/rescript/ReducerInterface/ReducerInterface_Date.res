module EV = ReducerInterface_InternalExpressionValue
type expressionValue = EV.expressionValue

let dispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [IevDate(t)]) => EV.IevString(DateTime.Date.toString(t))->Ok->Some
  | ("makeDateFromYear", [IevNumber(year)]) =>
    switch DateTime.Date.makeFromYear(year) {
    | Ok(t) => EV.IevDate(t)->Ok->Some
    | Error(e) => Reducer_ErrorValue.RETodo(e)->Error->Some
    }
  | ("dateFromNumber", [IevNumber(f)]) => EV.IevDate(DateTime.Date.fromFloat(f))->Ok->Some
  | ("toNumber", [IevDate(f)]) => EV.IevNumber(DateTime.Date.toFloat(f))->Ok->Some
  | ("subtract", [IevDate(d1), IevDate(d2)]) =>
    switch DateTime.Date.subtract(d1, d2) {
    | Ok(d) => EV.IevTimeDuration(d)->Ok
    | Error(e) => Error(RETodo(e))
    }->Some
  | ("subtract", [IevDate(d1), IevTimeDuration(d2)]) =>
    EV.IevDate(DateTime.Date.subtractDuration(d1, d2))->Ok->Some
  | ("add", [IevDate(d1), IevTimeDuration(d2)]) =>
    EV.IevDate(DateTime.Date.addDuration(d1, d2))->Ok->Some
  | _ => None
  }
}
