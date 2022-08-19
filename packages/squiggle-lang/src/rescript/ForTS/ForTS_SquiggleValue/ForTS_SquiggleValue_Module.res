open ForTS__Types

let getKeyValuePairs = (v: squiggleValue_Module): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.nameSpaceToKeyValueArray(v)
