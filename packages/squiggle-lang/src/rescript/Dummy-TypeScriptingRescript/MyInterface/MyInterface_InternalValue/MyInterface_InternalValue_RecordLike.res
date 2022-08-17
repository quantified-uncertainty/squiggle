type t = MyInterface_InternalValue_T.recordLike
let toString = (value: t, recToString) => {
  let contents =
    Belt.Map.String.mapWithKey(value, (key, value) => {
      `${key}: ${recToString(value)}`
    })
    ->Belt.Map.String.toArray
    ->Js.Array2.joinWith(", ")
  `{${contents}}`
}

let toArray = (value: t) => Belt.Map.String.toArray(value)
