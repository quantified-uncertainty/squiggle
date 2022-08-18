open ForTS_Types_

@module("ForTS_InternalValue_tag") @scope("InternalValueTag")
external ivtVoid_: int = "IvtVoid"
@module("ForTS_InternalValue_tag") @scope("InternalValueTag")
external ivtString_: int = "IvtString"
@module("ForTS_InternalValue_tag") @scope("InternalValueTag")
external ivtRecordLike_: int = "IvtRecordLike"

@genType
let getTag = (variant: internalValue) =>
  switch variant {
  | IvVoid(_) => ivtVoid_
  | IvString(_) => ivtString_
  | IvRecordLike(_) => ivtRecordLike_
  }

@genType
let getVoid = (variant: internalValue): option<internalVoid> =>
  switch variant {
  | IvVoid(v) => Some(v)
  | _ => None
  }

@genType
let getString = (variant: internalValue): option<string> =>
  switch variant {
  | IvString(s) => Some(s)
  | _ => None
  }

@genType
let getRecordLike = (variant: internalValue): option<recordLike> =>
  switch variant {
  | IvRecordLike(r) => Some(r)
  | _ => None
  }
