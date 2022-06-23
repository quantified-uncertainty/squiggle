module EV = ReducerInterface_InternalExpressionValue
type expressionValue = EV.expressionValue

let dispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [IEvTimeDuration(t)]) => EV.IEvString(DateTime.Duration.toString(t))->Ok->Some
  | ("minutes", [IEvNumber(f)]) => EV.IEvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("fromUnit_minutes", [IEvNumber(f)]) =>
    EV.IEvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("hours", [IEvNumber(f)]) => EV.IEvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("fromUnit_hours", [IEvNumber(f)]) =>
    EV.IEvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("days", [IEvNumber(f)]) => EV.IEvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("fromUnit_days", [IEvNumber(f)]) => EV.IEvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("years", [IEvNumber(f)]) => EV.IEvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("fromUnit_years", [IEvNumber(f)]) =>
    EV.IEvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("toHours", [IEvTimeDuration(f)]) => EV.IEvNumber(DateTime.Duration.toHours(f))->Ok->Some
  | ("toMinutes", [IEvTimeDuration(f)]) => EV.IEvNumber(DateTime.Duration.toMinutes(f))->Ok->Some
  | ("toDays", [IEvTimeDuration(f)]) => EV.IEvNumber(DateTime.Duration.toDays(f))->Ok->Some
  | ("toYears", [IEvTimeDuration(f)]) => EV.IEvNumber(DateTime.Duration.toYears(f))->Ok->Some
  | ("add", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) =>
    EV.IEvTimeDuration(DateTime.Duration.add(d1, d2))->Ok->Some
  | ("subtract", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) =>
    EV.IEvTimeDuration(DateTime.Duration.subtract(d1, d2))->Ok->Some
  | ("multiply", [IEvTimeDuration(d1), IEvNumber(d2)]) =>
    EV.IEvTimeDuration(DateTime.Duration.multiply(d1, d2))->Ok->Some
  | ("divide", [IEvTimeDuration(d1), IEvNumber(d2)]) =>
    EV.IEvTimeDuration(DateTime.Duration.divide(d1, d2))->Ok->Some
  | ("divide", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) => EV.IEvNumber(d1 /. d2)->Ok->Some
  | _ => None
  }
}
