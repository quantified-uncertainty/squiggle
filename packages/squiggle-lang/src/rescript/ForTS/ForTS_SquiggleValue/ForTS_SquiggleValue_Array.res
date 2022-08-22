type squiggleValue = ForTS_SquiggleValue.squiggleValue
@genType type squiggleValue_Array = ForTS_SquiggleValue.squiggleValue_Array //re-export recursive type

@genType
let getValues = (v: squiggleValue_Array): array<squiggleValue> =>
  ReducerInterface_InternalExpressionValue.arrayToValueArray(v)
