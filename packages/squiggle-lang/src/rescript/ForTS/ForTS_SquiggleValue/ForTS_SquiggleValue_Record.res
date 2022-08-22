type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
@genType type squiggleValue_Record = ForTS_SquiggleValue.squiggleValue_Record //re-export recursive type

@genType
let getKeyValuePairs = (value: squiggleValue_Record): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.recordToKeyValuePairs(value)
