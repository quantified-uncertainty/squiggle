open ForTS__Types

let getKeyValuePairs = (value: squiggleValue_Record): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.recordToKeyValuePairs(value)
