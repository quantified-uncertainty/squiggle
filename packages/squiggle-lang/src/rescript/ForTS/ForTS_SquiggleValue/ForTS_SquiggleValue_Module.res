type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
@genType type squiggleValue_Module = ForTS_SquiggleValue.squiggleValue_Module //re-export recursive type

@genType
let getKeyValuePairs = (v: squiggleValue_Module): array<(string, squiggleValue)> =>
  ReducerInterface_InternalExpressionValue.nameSpaceToKeyValuePairs(v)

@genType
let toString = (v: squiggleValue_Module): string =>
  ReducerInterface_InternalExpressionValue.toStringNameSpace(v)

@genType
let toSquiggleValue = (v: squiggleValue_Module): squiggleValue => IEvBindings(v)

@genType
let get = ReducerInterface_InternalExpressionValue.nameSpaceGet
