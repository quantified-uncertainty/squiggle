module ExpressionValue = ReducerInterface_ExpressionValue
type expressionValue = ExpressionValue.expressionValue

let dateDispatch = (call: ExpressionValue.functionCall, env: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [EvDate(t)]) => EvString(E.Date.toString(t))->Ok->Some
  | ("makeDateFromYear", [EvNumber(year)]) =>
    switch E.Date.makeFromYear(year) {
    | Ok(t) => EvDate(t)->Ok->Some
    | Error(e) => RETodo(e)->Error->Some
    }
  | ("dateFromNumber", [EvNumber(f)]) => EvDate(E.Date.fromFloat(f))->Ok->Some
  | ("toNumber", [EvDate(f)]) => EvNumber(E.Date.toFloat(f))->Ok->Some
  | ("subtract", [EvDate(d1), EvDate(d2)]) =>
    switch E.Date.subtract(d1, d2) {
    | Ok(d) => EvTimeDuration(d)->Ok
    | Error(e) => Error(RETodo(e))
    }->Some
  | ("subtract", [EvDate(d1), EvTimeDuration(d2)]) =>
    EvDate(E.Date.subtractDuration(d1, d2))->Ok->Some
  | ("add", [EvDate(d1), EvTimeDuration(d2)]) => EvDate(E.Date.addDuration(d1, d2))->Ok->Some
  | _ => None
  }
}

let durationDispatch = (call: ExpressionValue.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [EvTimeDuration(t)]) => EvString(E.Duration.toString(t))->Ok->Some
  | ("hours", [EvNumber(f)]) => EvTimeDuration(E.Duration.fromHours(f))->Ok->Some
  | ("minutes", [EvNumber(f)]) => EvTimeDuration(E.Duration.fromMinutes(f))->Ok->Some
  | ("days", [EvNumber(f)]) => EvTimeDuration(E.Duration.fromDays(f))->Ok->Some
  | ("years", [EvNumber(f)]) => EvTimeDuration(E.Duration.fromYears(f))->Ok->Some
  | ("toHours", [EvTimeDuration(f)]) => EvNumber(E.Duration.toHours(f))->Ok->Some
  | ("toMinutes", [EvTimeDuration(f)]) => EvNumber(E.Duration.toMinutes(f))->Ok->Some
  | ("toDays", [EvTimeDuration(f)]) => EvNumber(E.Duration.toDays(f))->Ok->Some
  | ("toYears", [EvTimeDuration(f)]) => EvNumber(E.Duration.toYears(f))->Ok->Some
  | ("add", [EvTimeDuration(d1), EvTimeDuration(d2)]) => 
      EvTimeDuration(E.Duration.add(d1, d2))->Ok->Some
  | ("subtract", [EvTimeDuration(d1), EvTimeDuration(d2)]) => 
      EvTimeDuration(E.Duration.subtract(d1, d2))->Ok->Some
  | ("multiply", [EvTimeDuration(d1), EvNumber(d2)]) => 
      EvTimeDuration(E.Duration.multiply(d1, d2))->Ok->Some
  | ("divide", [EvTimeDuration(d1), EvNumber(d2)]) => 
      EvTimeDuration(E.Duration.divide(d1, d2))->Ok->Some
  | _ => None
  }
}

let dispatch = (call: ExpressionValue.functionCall, env: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch dateDispatch(call, env) {
  | Some(r) => Some(r)
  | None =>
    switch durationDispatch(call, env) {
    | Some(r) => Some(r)
    | None => None
    }
  }
}
