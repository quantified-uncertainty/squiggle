module F = E_F

let toString = F.pipe(Js.Json.decodeString, E_O.default(""))
let fromString = Js.Json.string
let fromNumber = Js.Json.number

module O = {
  let fromString = (str: string) =>
    switch str {
    | "" => None
    | _ => Some(Js.Json.string(str))
    }

  let toString = (str: option<'a>) =>
    switch str {
    | Some(str) => Some(str |> F.pipe(Js.Json.decodeString, E_O.default("")))
    | _ => None
    }
}
