module EV = ReducerInterface_ExpressionValue
type expressionValue = EV.expressionValue

let dispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [EvDate(t)]) => EV.EvString(DateTime.Date.toString(t))->Ok->Some
  | ("makeDateFromYear", [EvNumber(year)]) =>
    switch DateTime.Date.makeFromYear(year) {
    | Ok(t) => EV.EvDate(t)->Ok->Some
    | Error(e) => Reducer_ErrorValue.RETodo(e)->Error->Some
    }
  | ("dateFromNumber", [EvNumber(f)]) => EV.EvDate(DateTime.Date.fromFloat(f))->Ok->Some
  | ("toNumber", [EvDate(f)]) => EV.EvNumber(DateTime.Date.toFloat(f))->Ok->Some
  | ("subtract", [EvDate(d1), EvDate(d2)]) =>
    switch DateTime.Date.subtract(d1, d2) {
    | Ok(d) => EV.EvTimeDuration(d)->Ok
    | Error(e) => Error(RETodo(e))
    }->Some
  | ("subtract", [EvDate(d1), EvTimeDuration(d2)]) =>
    EV.EvDate(DateTime.Date.subtractDuration(d1, d2))->Ok->Some
  | ("add", [EvDate(d1), EvTimeDuration(d2)]) =>
    EV.EvDate(DateTime.Date.addDuration(d1, d2))->Ok->Some
  | _ => None
  }
}