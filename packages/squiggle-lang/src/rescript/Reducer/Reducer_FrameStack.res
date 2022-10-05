// This is called "frameStack" and not "callStack", because the last frame in errors is often not a function call.
// A "frame" is a pair of a scope (function or top-level scope, currently stored as a string) and a location inside it.
// See this comment to deconfuse about what a frame is: https://github.com/quantified-uncertainty/squiggle/pull/1172#issuecomment-1264115038
type t = Reducer_T.frameStack

module Frame = {
  let toString = ({name, location}: Reducer_T.frame) =>
    name ++
    switch location {
    | Some(location) =>
      ` at line ${location.start.line->Js.Int.toString}, column ${location.start.column->Js.Int.toString}`
    | None => ""
    }

  @genType
  let toLocation = (t: Reducer_T.frame): option<Reducer_Peggy_Parse.location> => t.location

  @genType
  let toName = (t: Reducer_T.frame): string => t.name
}

let make = (): t => list{}

let extend = (t: t, name: string, location: option<Reducer_Peggy_Parse.location>) =>
  t->Belt.List.add({
    name: name,
    location: location,
  })

let makeSingleFrameStack = (location: Reducer_Peggy_Parse.location): t =>
  make()->extend(Reducer_T.topFrameName, Some(location))

let toString = (t: t) =>
  t
  ->Belt.List.map(s => "  " ++ s->Frame.toString ++ "\n")
  ->Belt.List.toArray
  ->Js.Array2.joinWith("")

@genType
let toFrameArray = (t: t): array<Reducer_T.frame> => t->Belt.List.toArray

@genType
let getTopFrame = (t: t): option<Reducer_T.frame> => t->Belt.List.head

let isEmpty = (t: t): bool =>
  switch t->Belt.List.head {
  | Some(_) => true
  | None => false
  }
