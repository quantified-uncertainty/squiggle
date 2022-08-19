open ForTS__Types

@genType
let getKeyValuePairs = (v: squiggleValue_Module): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.nameSpaceToKeyValueArray(v)
