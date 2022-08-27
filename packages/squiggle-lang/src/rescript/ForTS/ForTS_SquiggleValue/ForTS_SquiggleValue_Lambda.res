@genType type squiggleValue_Lambda = ReducerInterface_InternalExpressionValue.lambdaValue //re-export

@genType
let toString = (v: squiggleValue_Lambda): string =>
  ReducerInterface_InternalExpressionValue.toStringLambda(v)
