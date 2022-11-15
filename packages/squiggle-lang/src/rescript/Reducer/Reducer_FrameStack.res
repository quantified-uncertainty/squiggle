// This is called "frameStack" and not "callStack", because the last frame in errors is often not a function call.
// A "frame" is a pair of a scope (function or top-level scope, currently stored as a string) and a location inside it.
// See this comment to deconfuse about what a frame is: https://github.com/quantified-uncertainty/squiggle/pull/1172#issuecomment-1264115038
type t = Reducer_T.frameStack

module Frame = {
  let toString = ({name, location}: Reducer_T.frame) =>
    name ++
    switch location {
    | Some(location) =>
      ` at line ${location.start.line->Js.Int.toString}, column ${location.start.column->Js.Int.toString}` // TODO - source id?
    | None => ""
    }

  @genType
  let getLocation = (t: Reducer_T.frame): option<Reducer_Peggy_Parse.location> => t.location

  @genType
  let getName = (t: Reducer_T.frame): string => t.name
}

let make = (): t => list{}

let extend = (t: t, name: string, location: option<Reducer_Peggy_Parse.location>) =>
  t->Belt.List.add({
    name,
    location,
  })

// this is useful for SyntaxErrors
let makeSingleFrameStack = (location: Reducer_Peggy_Parse.location): t =>
  make()->extend(Reducer_T.topFrameName, Some(location))

// this includes the left offset because it's mostly used in SqError.toStringWithStackTrace
let toString = (t: t) =>
  t->Belt.List.map(s => "  " ++ s->Frame.toString)->Belt.List.toArray->Js.Array2.joinWith("\n")

@genType
let toFrameArray = (t: t): array<Reducer_T.frame> => t->Belt.List.toArray

@genType
let getTopFrame = (t: t): option<Reducer_T.frame> => t->Belt.List.head

let isEmpty = (t: t): bool =>
  switch t->Belt.List.head {
  | Some(_) => true
  | None => false
  }
