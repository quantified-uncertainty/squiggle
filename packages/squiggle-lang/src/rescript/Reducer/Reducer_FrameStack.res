type t = Reducer_T.frameStack

module Frame = {
  let toString = ({lambda, location}: Reducer_T.frame) =>
    `${fromFrame} at ${location.start.line->Js.Int.toString}, column ${location.start.column->Js.Int.toString}`
}

let make = (): t => list{}

let topFrameName = (t: t) =>
  switch t->getTopFrame {
  | Some({lambda}) =>
    switch lambda {
    | FnLambda({name}) => name
    | FnBuiltin({name}) => name
    }
  | None => "<main>"
  }

let extend = (t: t, lambda: Reducer_T.lambdaValue, location: option<location>) =>
  t->Belt.List.add({
    lambda: lambda,
    fromLocation: location,
    fromFrame: t->topFrameName,
  })

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
