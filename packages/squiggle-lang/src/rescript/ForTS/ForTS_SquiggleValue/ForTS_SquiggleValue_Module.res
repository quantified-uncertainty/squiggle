type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
@genType type squiggleValue_Module = ForTS_SquiggleValue.squiggleValue_Module //re-export recursive type

@genType
let getKeyValuePairs = (v: squiggleValue_Module): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.nameSpaceToKeyValuePairs(v)
