open ASTTypes.AST
// This file exists to manage a dependency cycle. It would be good to refactor later.

let rec toString: node => string = x =>
  switch x {
  | #SymbolicDist(d) => SymbolicDist.T.toString(d)
  | #RenderedDist(_) => "[renderedShape]"
  | #AlgebraicCombination(op, t1, t2) => Operation.Algebraic.format(op, toString(t1), toString(t2))
  | #PointwiseCombination(op, t1, t2) => Operation.Pointwise.format(op, toString(t1), toString(t2))
  | #Normalize(t) => "normalize(k" ++ (toString(t) ++ ")")
  | #Truncate(lc, rc, t) => Operation.T.truncateToString(lc, rc, toString(t))
  | #Render(t) => toString(t)
  | #Symbol(t) => "Symbol: " ++ t
  | #FunctionCall(name, args) =>
    "[Function call: (" ++
    (name ++
    ((args |> E.A.fmap(toString) |> Js.String.concatMany(_, ",")) ++ ")]"))
  | #Function(args, internal) =>
    "[Function: (" ++ ((args |> Js.String.concatMany(_, ",")) ++ (toString(internal) ++ ")]"))
  | #Array(a) => "[" ++ ((a |> E.A.fmap(toString) |> Js.String.concatMany(_, ",")) ++ "]")
  | #Hash(h) =>
    "{" ++
    ((h
    |> E.A.fmap(((name, value)) => name ++ (":" ++ toString(value)))
    |> Js.String.concatMany(_, ",")) ++
    "}")
  }