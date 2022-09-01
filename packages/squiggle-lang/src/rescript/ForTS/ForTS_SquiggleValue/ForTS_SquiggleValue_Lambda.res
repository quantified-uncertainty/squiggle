@genType type squiggleValue_Lambda = ReducerInterface_InternalExpressionValue.lambdaValue //re-export

@genType
let toString = (v: squiggleValue_Lambda): string =>
  ReducerInterface_InternalExpressionValue.toStringFunction(v)

@genType
let parameters = (v: squiggleValue_Lambda): array<string> => {
  v.parameters
}
