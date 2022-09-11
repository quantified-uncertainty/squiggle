module InternalExpressionValue = ReducerInterface_InternalExpressionValue

type t = Reducer_T.nameSpace

let toValue = nameSpace => Reducer_T.IEvBindings(nameSpace)
let toString = nameSpace => InternalExpressionValue.toString(toValue(nameSpace))
let toStringResult = rNameSpace =>
  Belt.Result.map(rNameSpace, toValue(_))->InternalExpressionValue.toStringResult
let toStringOptionResult = orNameSpace =>
  Belt.Option.map(
    orNameSpace,
    Belt.Result.map(_, toValue(_)),
  )->InternalExpressionValue.toStringOptionResult

let inspect = (nameSpace, label: string) => Js.log(`${label}: ${toString(nameSpace)}`)

let inspectOption = (oNameSpace, label: string) =>
  switch oNameSpace {
  | Some(nameSpace) => inspect(nameSpace, label)
  | None => Js.log(`${label}: None`)
  }
