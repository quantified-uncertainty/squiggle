module IEV = ReducerInterface_InternalExpressionValue
type internalExpressionValue = IEV.t

let dispatch = (call: IEV.functionCall, _: DistributionOperation.env): option<
  result<internalExpressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [IEvDate(t)]) => IEV.IEvString(DateTime.Date.toString(t))->Ok->Some
  | ("makeDateFromYear", [IEvNumber(year)]) =>
    switch DateTime.Date.makeFromYear(year) {
    | Ok(t) => IEV.IEvDate(t)->Ok->Some
    | Error(e) => Reducer_ErrorValue.RETodo(e)->Error->Some
    }
  | ("dateFromNumber", [IEvNumber(f)]) => IEV.IEvDate(DateTime.Date.fromFloat(f))->Ok->Some
  | ("toNumber", [IEvDate(f)]) => IEV.IEvNumber(DateTime.Date.toFloat(f))->Ok->Some
  | ("subtract", [IEvDate(d1), IEvDate(d2)]) =>
    switch DateTime.Date.subtract(d1, d2) {
    | Ok(d) => IEV.IEvTimeDuration(d)->Ok
    | Error(e) => Error(RETodo(e))
    }->Some
  | ("subtract", [IEvDate(d1), IEvTimeDuration(d2)]) =>
    IEV.IEvDate(DateTime.Date.subtractDuration(d1, d2))->Ok->Some
  | ("add", [IEvDate(d1), IEvTimeDuration(d2)]) =>
    IEV.IEvDate(DateTime.Date.addDuration(d1, d2))->Ok->Some
  | _ => None
  }
}
