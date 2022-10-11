type t = Reducer_T.lambdaValue

let name = (t: t): string => {
  switch t {
  | FnLambda({name}) => name->E.O2.default("<anonymous>")
  | FnBuiltin({name}) => name
  }
}
