type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
@genType type squiggleValue_Type = ForTS_SquiggleValue.squiggleValue_Type //re-export recursive type

@genType
let getKeyValuePairs = (value: squiggleValue_Type): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.recordToKeyValuePairs(value)

@genType
let toString = (value: squiggleValue_Type): string =>
  ReducerInterface_InternalExpressionValue.toStringType(value)
