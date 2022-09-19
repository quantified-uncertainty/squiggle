type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
@genType type squiggleValue_Type = ForTS_SquiggleValue.squiggleValue_Type //re-export recursive type

@genType
let getKeyValuePairs = (value: squiggleValue_Type): array<(string, squiggleValue)> =>
  Reducer_Value.recordToKeyValuePairs(value)

@genType
let toString = (value: squiggleValue_Type): string =>
  Reducer_Value.toStringType(value)
