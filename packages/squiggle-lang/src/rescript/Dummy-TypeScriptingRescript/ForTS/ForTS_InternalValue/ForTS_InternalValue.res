open ForTS_Types

@module("ForTS_InternalValue_tag") @scope("InternalValueTag")
external ivtVoid_: int = "IvtVoid"
@module("ForTS_InternalValue_tag") @scope("InternalValueTag")
external ivtString_: int = "IvtString"
@module("ForTS_InternalValue_tag") @scope("InternalValueTag")
external ivtRecordLike_: int = "IvtRecordLike"

let getTag = (variant: internalValue) =>
  switch variant {
  | IvVoid(_) => ivtVoid_
  | IvString(_) => ivtString_
  | IvRecordLike(_) => ivtRecordLike_
  }

let getVoid = (variant: internalValue): option<internalVoid> =>
  switch variant {
  | IvVoid(v) => Some(v)
  | _ => None
  }

let getString = (variant: internalValue): option<string> =>
  switch variant {
  | IvString(s) => Some(s)
  | _ => None
  }

let getRecordLike = (variant: internalValue): option<recordLike> =>
  switch variant {
  | IvRecordLike(r) => Some(r)
  | _ => None
  }
