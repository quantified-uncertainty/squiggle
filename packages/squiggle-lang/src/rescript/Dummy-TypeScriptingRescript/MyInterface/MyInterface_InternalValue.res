open MyInterface_InternalValue_T

let rec toString = (v: internalValue): string => {
  switch v {
  | IvString(s) => MyInterface_InternalValue_String.toString(s)
  | IvRecordLike(m) => MyInterface_InternalValue_RecordLike.toString(m, toString)
  | IvVoid(_v) => MyInterface_InternalValue_Void.toString
  }
}
