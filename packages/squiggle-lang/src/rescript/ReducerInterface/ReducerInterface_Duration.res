module EV = ReducerInterface_InternalExpressionValue
type expressionValue = EV.expressionValue

let dispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [IevTimeDuration(t)]) => EV.IevString(DateTime.Duration.toString(t))->Ok->Some
  | ("minutes", [IevNumber(f)]) => EV.IevTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("fromUnit_minutes", [IevNumber(f)]) =>
    EV.IevTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("hours", [IevNumber(f)]) => EV.IevTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("fromUnit_hours", [IevNumber(f)]) =>
    EV.IevTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("days", [IevNumber(f)]) => EV.IevTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("fromUnit_days", [IevNumber(f)]) => EV.IevTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("years", [IevNumber(f)]) => EV.IevTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("fromUnit_years", [IevNumber(f)]) =>
    EV.IevTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("toHours", [IevTimeDuration(f)]) => EV.IevNumber(DateTime.Duration.toHours(f))->Ok->Some
  | ("toMinutes", [IevTimeDuration(f)]) => EV.IevNumber(DateTime.Duration.toMinutes(f))->Ok->Some
  | ("toDays", [IevTimeDuration(f)]) => EV.IevNumber(DateTime.Duration.toDays(f))->Ok->Some
  | ("toYears", [IevTimeDuration(f)]) => EV.IevNumber(DateTime.Duration.toYears(f))->Ok->Some
  | ("add", [IevTimeDuration(d1), IevTimeDuration(d2)]) =>
    EV.IevTimeDuration(DateTime.Duration.add(d1, d2))->Ok->Some
  | ("subtract", [IevTimeDuration(d1), IevTimeDuration(d2)]) =>
    EV.IevTimeDuration(DateTime.Duration.subtract(d1, d2))->Ok->Some
  | ("multiply", [IevTimeDuration(d1), IevNumber(d2)]) =>
    EV.IevTimeDuration(DateTime.Duration.multiply(d1, d2))->Ok->Some
  | ("divide", [IevTimeDuration(d1), IevNumber(d2)]) =>
    EV.IevTimeDuration(DateTime.Duration.divide(d1, d2))->Ok->Some
  | ("divide", [IevTimeDuration(d1), IevTimeDuration(d2)]) => EV.IevNumber(d1 /. d2)->Ok->Some
  | _ => None
  }
}
