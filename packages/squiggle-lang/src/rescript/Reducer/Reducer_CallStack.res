@genType.opaque
type rec lambdaFrame = {location: Reducer_Peggy_Parse.location, name: string}
@genType.opaque and ffiFrame = {name: string}
@genType
and frame =
  | InLambda(lambdaFrame)
  | InFFI(ffiFrame)

let toStringFrame = (t: frame) =>
  switch t {
  | InLambda({location}) =>
    `Line ${location.start.line->Js.Int.toString}, column ${location.start.column->Js.Int.toString}, source ${location.source}`
  | InFFI({name}) => `Builtin ${name}`
  }

@genType.opaque
type rec t = list<frame>

let make = (): t => list{}

let extend = (t: t, frame: frame) => t->Belt.List.add(frame)

let toString = (t: t) =>
  t->Belt.List.map(s => "  " ++ s->toStringFrame ++ "\n")->Belt.List.toArray->Js.Array2.joinWith("")

@genType
let toFrameArray = (t: t): array<frame> => t->Belt.List.toArray

@genType
let getTopFrame = (t: t): option<frame> => t->Belt.List.head

let isEmpty = (t: t): bool =>
  switch t->Belt.List.head {
  | Some(_) => true
  | None => false
  }
