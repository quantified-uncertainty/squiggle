open ForTS_Types

@genType
let toString = (v: recordLike): string =>
  MyInterface_InternalValue_RecordLike.toString(v, MyInterface_InternalValue.toString)
@genType
let toArray = (v: recordLike): array<(string, internalValue)> =>
  MyInterface_InternalValue_RecordLike.toArray(v)
