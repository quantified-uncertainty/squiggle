open ReducerInterface.ExpressionValue

type rec expression =
  | EList(list<expression>) // A list to map-reduce
  | EValue(expressionValue) // Irreducible built-in value. Reducer should not know the internals. External libraries are responsible
