@genType type squiggleValue_Declaration = Reducer_T.lambdaDeclaration //re-export

@genType
let toString = (v: squiggleValue_Declaration): string =>
  ReducerInterface_InternalExpressionValue.toStringDeclaration(v)
