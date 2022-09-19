@genType type squiggleValue_Lambda = Reducer_T.lambdaValue //re-export

@genType
let toString = (v: squiggleValue_Lambda): string =>
  Reducer_Value.toStringFunction(v)

@genType
let parameters = (v: squiggleValue_Lambda): array<string> => {
  v.parameters
}
