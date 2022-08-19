open ForTS__Types
// Note: Internal representation will not be an array in the future.
// Thus we still to have a conversion

@genType
let getValues = (v: squiggleValue_Array): array<squiggleValue> =>
  ReducerInterface_InternalExpressionValue.arrayToValueArray(v)
