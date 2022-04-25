open ReducerInterface.ExpressionValue

/*
  An expression is a Lisp AST. An expression is either a primitive value or a list of expressions.
  In the case of a list of expressions (e1, e2, e3, ...eN), the semantic is
     apply e1, e2 -> apply e3 -> ... -> apply eN
  This is Lisp semantics. It holds true in both eager and lazy evaluations.
  A Lisp AST contains only expressions/primitive values to apply to their left.
  The act of defining the semantics of a functional language is to write it in terms of Lisp AST.
*/

type rec expression =
  | EList(list<expression>) // A list to map-reduce
  | EValue(expressionValue) // Irreducible built-in value. Reducer should not know the internals. External libraries are responsible
  | EBindings(bindings) // $let kind of statements return bindings; for internal use only
  | EParameters(array<string>) // for $defun; for internal use only
and bindings = Belt.Map.String.t<expression>

module Bindings = {
  type t = bindings
  let get = (t: t, str: string) => Belt.Map.String.get(t, str)

  let set = (t: t, key: string, value: expression): t => {
    Belt.Map.String.set(t, key, value)
  }

  let getResult = (t: t, str: string): result<expression, Reducer_ErrorValue.errorValue> =>
    get(t, str) |> E.O.toResult(Reducer_ErrorValue.RESymbolNotFound(str))

  module Parameters = {
    let parametersKey = "$parameters"
    let default = EParameters([])
    let get = (t: t): array<string> => {
      let expressionParameters = Belt.Map.String.getWithDefault(t, parametersKey, default)
      switch expressionParameters {
      | EParameters(parameters) => parameters
      | _ => []
      }
    }

    let has = (t: t, s: string): bool => E.A.has(get(t), s)

    let setArray = (t: t, newParameters: array<string>): t => {
      let oldParameters = get(t)
      let updatedParameters = Js.Array2.concat(oldParameters, newParameters)
      Belt.Map.String.set(t, parametersKey, EParameters(updatedParameters))
    }
  }

  // We cannot bind the parameters with global values
  let getIfNotInParameters = (t: t, aSymbol: string):option<expression> => {
    if Parameters.has(t, aSymbol) {
      None
    } else {
      get(t, aSymbol)
    }
  }

  // We cannot bind the parameters with global values
  let getResultIfNotInParameters = (t: t, aSymbol: string) => {
    if Parameters.has(t, aSymbol) {
      None
    } else {
      Some(getResult(t, aSymbol))
    }
  }
}
