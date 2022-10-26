@genType type squiggleValue = Reducer_T.value //re-export
type error = SqError.t //use

@genType type squiggleValue_Array = Reducer_T.arrayValue //re-export recursive type
@genType type squiggleValue_Record = Reducer_T.map //re-export recursive type
type squiggleValue_Declaration = ForTS_SquiggleValue_Declaration.squiggleValue_Declaration //use
type squiggleValue_Distribution = ForTS_SquiggleValue_Distribution.squiggleValue_Distribution //use
type squiggleValue_Lambda = ForTS_SquiggleValue_Lambda.squiggleValue_Lambda //use

// Return values are kept as they are if they are JavaScript types.

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtArray_: string = "Array"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtBool_: string = "Bool"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtDate_: string = "Date"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtDeclaration_: string = "Declaration"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtDistribution_: string = "Distribution"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtLambda_: string = "Lambda"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtNumber_: string = "Number"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtRecord_: string = "Record"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtString_: string = "String"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtTimeDuration_: string = "TimeDuration"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtVoid_: string = "Void"

@genType.import("./ForTS_SquiggleValue_tag")
type squiggleValueTag

external castEnum: string => squiggleValueTag = "%identity"

@genType
let getTag = (variant: squiggleValue): squiggleValueTag =>
  switch variant {
  | IEvArray(_) => svtArray_->castEnum
  | IEvBool(_) => svtBool_->castEnum
  | IEvDate(_) => svtDate_->castEnum
  | IEvDeclaration(_) => svtDeclaration_->castEnum
  | IEvDistribution(_) => svtDistribution_->castEnum
  | IEvLambda(_) => svtLambda_->castEnum
  | IEvNumber(_) => svtNumber_->castEnum
  | IEvRecord(_) => svtRecord_->castEnum
  | IEvString(_) => svtString_->castEnum
  | IEvTimeDuration(_) => svtTimeDuration_->castEnum
  | IEvVoid => svtVoid_->castEnum
  }

@genType
let toString = (variant: squiggleValue) => Reducer_Value.toString(variant)

// This is a useful method for unit tests.
// Convert the result along with the error message to a string.
@genType
let toStringResult = (variantResult: result<squiggleValue, error>) =>
  Reducer_Value.toStringResult(variantResult)

@genType
let getArray = (variant: squiggleValue): squiggleValue_Array =>
  //FIXME: Convert
  switch variant {
  | IEvArray(arrayLike) => arrayLike
  | _ => raise(Not_found)
  }

@genType
let getBool = (variant: squiggleValue): bool =>
  switch variant {
  | IEvBool(value) => value
  | _ => raise(Not_found)
  }

@genType
let getDate = (variant: squiggleValue): Js.Date.t =>
  switch variant {
  | IEvDate(value) => value
  | _ => raise(Not_found)
  }

@genType
let getDeclaration = (variant: squiggleValue): squiggleValue_Declaration =>
  switch variant {
  | IEvDeclaration(value) => value
  | _ => raise(Not_found)
  }

@genType
let getDistribution = (variant: squiggleValue): squiggleValue_Distribution =>
  switch variant {
  | IEvDistribution(value) => value
  | _ => raise(Not_found)
  }

@genType
let getLambda = (variant: squiggleValue): squiggleValue_Lambda =>
  switch variant {
  | IEvLambda(value) => value
  | _ => raise(Not_found)
  }

@genType
let getNumber = (variant: squiggleValue): float =>
  switch variant {
  | IEvNumber(value) => value
  | _ => raise(Not_found)
  }

@genType
let getRecord = (variant: squiggleValue): squiggleValue_Record =>
  switch variant {
  | IEvRecord(value) => value
  | _ => raise(Not_found)
  }

@genType
let getString = (variant: squiggleValue): string =>
  switch variant {
  | IEvString(value) => value
  | _ => raise(Not_found)
  }

@genType
let getTimeDuration = (variant: squiggleValue): float =>
  switch variant {
  | IEvTimeDuration(value) => value
  | _ => raise(Not_found)
  }
