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

@genType
let getTopFrame = (t: t): option<Reducer_T.frame> => Belt.List.head(t)

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
