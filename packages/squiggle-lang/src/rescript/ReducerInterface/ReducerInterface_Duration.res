module IEV = ReducerInterface_InternalExpressionValue
type internalExpressionValue = IEV.t

let dispatch = (call: IEV.functionCall, _: DistributionOperation.env): option<
  result<internalExpressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [IEvTimeDuration(t)]) => IEV.IEvString(DateTime.Duration.toString(t))->Ok->Some
  | ("minutes", [IEvNumber(f)]) => IEV.IEvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("fromUnit_minutes", [IEvNumber(f)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("hours", [IEvNumber(f)]) => IEV.IEvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("fromUnit_hours", [IEvNumber(f)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("days", [IEvNumber(f)]) => IEV.IEvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("fromUnit_days", [IEvNumber(f)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("years", [IEvNumber(f)]) => IEV.IEvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("fromUnit_years", [IEvNumber(f)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("toHours", [IEvTimeDuration(f)]) => IEV.IEvNumber(DateTime.Duration.toHours(f))->Ok->Some
  | ("toMinutes", [IEvTimeDuration(f)]) => IEV.IEvNumber(DateTime.Duration.toMinutes(f))->Ok->Some
  | ("toDays", [IEvTimeDuration(f)]) => IEV.IEvNumber(DateTime.Duration.toDays(f))->Ok->Some
  | ("toYears", [IEvTimeDuration(f)]) => IEV.IEvNumber(DateTime.Duration.toYears(f))->Ok->Some
  | ("add", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.add(d1, d2))->Ok->Some
  | ("subtract", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.subtract(d1, d2))->Ok->Some
  | ("multiply", [IEvTimeDuration(d1), IEvNumber(d2)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.multiply(d1, d2))->Ok->Some
  | ("divide", [IEvTimeDuration(d1), IEvNumber(d2)]) =>
    IEV.IEvTimeDuration(DateTime.Duration.divide(d1, d2))->Ok->Some
  | ("divide", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) => IEV.IEvNumber(d1 /. d2)->Ok->Some
  | _ => None
  }
}
