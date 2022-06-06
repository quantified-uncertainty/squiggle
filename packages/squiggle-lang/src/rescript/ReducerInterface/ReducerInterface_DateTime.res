module EV = ReducerInterface_ExpressionValue
type expressionValue = EV.expressionValue

let dateDispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
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

module ScientificUnit = {
  let nameToMultiplier = str =>
    switch str {
    | "n" => Some(1E-9)
    | "m" => Some(1E-3)
    | "k" => Some(1E3)
    | "M" => Some(1E6)
    | "B" => Some(1E9)
    | "G" => Some(1E9)
    | "T" => Some(1E12)
    | "P" => Some(1E15)
    | _ => None
    }

  let getMultiplier = (r: string) => {
    let match = Js.String2.match_(r, %re(`/fromUnit_([_a-zA-Z]*)/`))
    switch match {
    | Some([_, unit]) => nameToMultiplier(unit)
    | _ => None
    }
  }
}

let durationDispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
  result<expressionValue, QuriSquiggleLang.Reducer_ErrorValue.errorValue>,
> => {
  switch call {
  | (
      ("fromUnit_n"
      | "fromUnit_m"
      | "fromUnit_k"
      | "fromUnit_M"
      | "fromUnit_B"
      | "fromUnit_G"
      | "fromUnit_T"
      | "fromUnit_P") as op,
      [EvNumber(f)],
    ) =>
    op->ScientificUnit.getMultiplier->E.O2.fmap(multiplier => EV.EvNumber(f *. multiplier)->Ok)
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

let dispatch = (call: EV.functionCall, env: DistributionOperation.env): option<
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
