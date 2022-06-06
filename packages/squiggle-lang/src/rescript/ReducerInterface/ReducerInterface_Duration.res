module EV = ReducerInterface_ExpressionValue
type expressionValue = EV.expressionValue

let dispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [EvTimeDuration(t)]) => EV.EvString(DateTime.Duration.toString(t))->Ok->Some
  | ("minutes", [EvNumber(f)]) => EV.EvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("fromUnit_minutes", [EvNumber(f)]) =>
    EV.EvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("hours", [EvNumber(f)]) => EV.EvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("fromUnit_hours", [EvNumber(f)]) => EV.EvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("days", [EvNumber(f)]) => EV.EvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("fromUnit_days", [EvNumber(f)]) => EV.EvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("years", [EvNumber(f)]) => EV.EvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("fromUnit_years", [EvNumber(f)]) => EV.EvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("toHours", [EvTimeDuration(f)]) => EV.EvNumber(DateTime.Duration.toHours(f))->Ok->Some
  | ("toMinutes", [EvTimeDuration(f)]) => EV.EvNumber(DateTime.Duration.toMinutes(f))->Ok->Some
  | ("toDays", [EvTimeDuration(f)]) => EV.EvNumber(DateTime.Duration.toDays(f))->Ok->Some
  | ("toYears", [EvTimeDuration(f)]) => EV.EvNumber(DateTime.Duration.toYears(f))->Ok->Some
  | ("add", [EvTimeDuration(d1), EvTimeDuration(d2)]) =>
    EV.EvTimeDuration(DateTime.Duration.add(d1, d2))->Ok->Some
  | ("subtract", [EvTimeDuration(d1), EvTimeDuration(d2)]) =>
    EV.EvTimeDuration(DateTime.Duration.subtract(d1, d2))->Ok->Some
  | ("multiply", [EvTimeDuration(d1), EvNumber(d2)]) =>
    EV.EvTimeDuration(DateTime.Duration.multiply(d1, d2))->Ok->Some
  | ("divide", [EvTimeDuration(d1), EvNumber(d2)]) =>
    EV.EvTimeDuration(DateTime.Duration.divide(d1, d2))->Ok->Some
  | _ => None
  }
}