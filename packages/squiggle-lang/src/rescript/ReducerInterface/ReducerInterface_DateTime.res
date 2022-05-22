module ExpressionValue = ReducerInterface_ExpressionValue
type expressionValue = ExpressionValue.expressionValue

let dateDispatch = (call: ExpressionValue.functionCall, env: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [EvDate(t)]) => EvString(E.Date.toString(t))->Ok->Some
  | ("makeDateFromYear", [EvNumber(year)]) =>
    EvDate(E.Date.makeWithYM(~year, ~month=0.0, ()))->Ok->Some
  | ("fromMilliseconds", [EvNumber(f)]) => EvDate(E.Date.fromFloat(f))->Ok->Some
  | ("toMilliseconds", [EvDate(f)]) => EvNumber(E.Date.toFloat(f))->Ok->Some
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

let durationDispatch = (call: ExpressionValue.functionCall, env: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | ("toString", [EvTimeDuration(t)]) => EvString(E.Duration.toString(t))->Ok->Some
  | ("hours", [EvNumber(f)]) => EvTimeDuration(E.Duration.fromHours(f))->Ok->Some
  | ("years", [EvNumber(f)]) => EvTimeDuration(E.Duration.fromYears(f))->Ok->Some
  | ("toHours", [EvTimeDuration(f)]) => EvNumber(E.Duration.toHours(f))->Ok->Some
  | ("toYears", [EvTimeDuration(f)]) => EvNumber(E.Duration.toYears(f))->Ok->Some
  | (
      ("add" | "subtract" | "multiply" | "divide") as op,
      [EvTimeDuration(d1), EvTimeDuration(d2)],
    ) => {
      let op = switch op {
      | "subtract" => E.Duration.subtract
      | "multiply" => E.Duration.multiply
      | "divide" => E.Duration.divide
      | "add"
      | _ => E.Duration.add
      }
      EvTimeDuration(op(d1, d2))->Ok->Some
    }
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
