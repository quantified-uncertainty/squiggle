module O = E_O
let concatSomes = (optionals: Js.Array.t<option<'a>>): Js.Array.t<'a> =>
  optionals
  |> Js.Array.filter(O.isSome)
  |> Js.Array.map(E_O.toExn(_, "Warning: This should not have happened"))
let filter = Js.Array.filter
