type rec internalValue =
  | IvString(string)
  | IvRecordLike(recordLike)
  | IvVoid(int)
and recordLike = Belt.Map.String.t<internalValue>

type t = internalValue
