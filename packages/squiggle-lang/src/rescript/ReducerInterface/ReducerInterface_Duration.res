module IEV = ReducerInterface_InternalExpressionValue
module T = Reducer_T
type internalExpressionValue = IEV.t

let dispatch = (call: IEV.functionCall, _: T.environment): option<
  result<Reducer_T.value, Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [IEvTimeDuration(t)]) => T.IEvString(DateTime.Duration.toString(t))->Ok->Some
  | ("minutes", [IEvNumber(f)]) => T.IEvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("fromUnit_minutes", [IEvNumber(f)]) =>
    T.IEvTimeDuration(DateTime.Duration.fromMinutes(f))->Ok->Some
  | ("hours", [IEvNumber(f)]) => T.IEvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("fromUnit_hours", [IEvNumber(f)]) =>
    T.IEvTimeDuration(DateTime.Duration.fromHours(f))->Ok->Some
  | ("days", [IEvNumber(f)]) => T.IEvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("fromUnit_days", [IEvNumber(f)]) => T.IEvTimeDuration(DateTime.Duration.fromDays(f))->Ok->Some
  | ("years", [IEvNumber(f)]) => T.IEvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("fromUnit_years", [IEvNumber(f)]) =>
    T.IEvTimeDuration(DateTime.Duration.fromYears(f))->Ok->Some
  | ("toHours", [IEvTimeDuration(f)]) => T.IEvNumber(DateTime.Duration.toHours(f))->Ok->Some
  | ("toMinutes", [IEvTimeDuration(f)]) => T.IEvNumber(DateTime.Duration.toMinutes(f))->Ok->Some
  | ("toDays", [IEvTimeDuration(f)]) => T.IEvNumber(DateTime.Duration.toDays(f))->Ok->Some
  | ("toYears", [IEvTimeDuration(f)]) => T.IEvNumber(DateTime.Duration.toYears(f))->Ok->Some
  | ("add", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) =>
    T.IEvTimeDuration(DateTime.Duration.add(d1, d2))->Ok->Some
  | ("subtract", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) =>
    T.IEvTimeDuration(DateTime.Duration.subtract(d1, d2))->Ok->Some
  | ("multiply", [IEvTimeDuration(d1), IEvNumber(d2)]) =>
    T.IEvTimeDuration(DateTime.Duration.multiply(d1, d2))->Ok->Some
  | ("divide", [IEvTimeDuration(d1), IEvNumber(d2)]) =>
    T.IEvTimeDuration(DateTime.Duration.divide(d1, d2))->Ok->Some
  | ("divide", [IEvTimeDuration(d1), IEvTimeDuration(d2)]) => T.IEvNumber(d1 /. d2)->Ok->Some
  | _ => None
  }
}
