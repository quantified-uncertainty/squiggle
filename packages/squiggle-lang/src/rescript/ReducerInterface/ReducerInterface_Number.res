module EV = ReducerInterface_ExpressionValue
type expressionValue = EV.expressionValue

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
    let match = Js.String2.match_(r, %re(`/fromUnit_([a-zA-Z]*)/`))
    switch match {
    | Some([_, unit]) => nameToMultiplier(unit)
    | _ => None
    }
  }
}

let dispatch = (call: EV.functionCall, _: DistributionOperation.env): option<
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
  | _ => None
  }
}
