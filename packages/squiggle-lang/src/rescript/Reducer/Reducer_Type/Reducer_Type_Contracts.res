module T = Reducer_Type_T

let isMin = (modifierArg: Reducer_Value.t, aValue: Reducer_Value.t): bool => {
  let pair = (modifierArg, aValue)
  switch pair {
  | (IEvNumber(a), IEvNumber(b)) => a <= b
  | _ => false
  }
}

let isMax = (modifierArg: Reducer_Value.t, aValue: Reducer_Value.t): bool => {
  let pair = (modifierArg, aValue)
  switch pair {
  | (IEvNumber(a), IEvNumber(b)) => a >= b
  | _ => false
  }
}

let isMemberOf = (modifierArg: Reducer_Value.t, aValue: Reducer_Value.t): bool => {
  let pair = (modifierArg, aValue)
  switch pair {
  | (ievA, IEvArray(b)) => Js.Array2.includes(b, ievA)
  | _ => false
  }
}

let checkModifier = (key: string, modifierArg: Reducer_Value.t, aValue: Reducer_Value.t): bool =>
  switch key {
  | "min" => isMin(modifierArg, aValue)
  | "max" => isMax(modifierArg, aValue)
  | "isMemberOf" => isMemberOf(modifierArg, aValue)
  | _ => false
  }

let checkModifiers = (
  contracts: Belt.Map.String.t<Reducer_Value.t>,
  aValue: Reducer_Value.t,
): bool => {
  contracts->Belt.Map.String.reduce(true, (acc, key, modifierArg) =>
    switch acc {
    | true => checkModifier(key, modifierArg, aValue)
    | _ => acc
    }
  )
}
