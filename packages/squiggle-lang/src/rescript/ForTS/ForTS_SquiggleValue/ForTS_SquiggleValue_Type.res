open ForTS__Types

let getKeyValuePairs = (value: squiggleValue_Type): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.recordToKeyValuePairs(value)
