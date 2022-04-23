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
  | EParameters(list<string>) // for $defun; for internal use only
and bindings = Belt.Map.String.t<expression>
