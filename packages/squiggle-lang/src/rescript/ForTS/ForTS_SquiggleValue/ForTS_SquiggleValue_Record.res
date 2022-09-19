type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
@genType type squiggleValue_Record = ForTS_SquiggleValue.squiggleValue_Record //re-export recursive type

@genType
let getKeyValuePairs = (value: squiggleValue_Record): array<(string, squiggleValue)> =>
  Reducer_Value.recordToKeyValuePairs(value)

@genType
let toString = (v: squiggleValue_Record) => Reducer_Value.toStringMap(v)

@genType
let toSquiggleValue = (v: squiggleValue_Record): squiggleValue => IEvRecord(v)
