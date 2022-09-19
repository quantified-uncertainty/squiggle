type squiggleValue = ForTS_SquiggleValue.squiggleValue
@genType type squiggleValue_Array = ForTS_SquiggleValue.squiggleValue_Array //re-export recursive type

@genType
let getValues = (v: squiggleValue_Array): array<squiggleValue> => Reducer_Value.arrayToValueArray(v)

@genType
let toString = (v: squiggleValue_Array): string => Reducer_Value.toStringArray(v)
