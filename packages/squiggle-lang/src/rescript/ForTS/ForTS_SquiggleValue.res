open ForTS__Types

// Return values as they are if they are JavaScript types.

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtArray_: int = "SvtArray"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtArrayString_: int = "SvtArrayString"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtBool_: int = "SvtBool"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtCall_: int = "SvtCall"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtDate_: int = "SvtDate"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtDeclaration_: int = "SvtDeclaration"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtDistribution_: int = "SvtDistribution"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtLambda_: int = "SvtLambda"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtModule_: int = "SvtModule"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtNumber_: int = "SvtNumber"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtRecord_: int = "SvtRecord"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtString_: int = "SvtString"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtSymbol_: int = "SvtSymbol"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtTimeDuration_: int = "SvtTimeDuration"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtType_: int = "SvtType"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtTypeIdentifier_: int = "SvtUndefined"

@module("ForTS_SquiggleValue_tag") @scope("SquiggleValueTag")
external svtVoid_: int = "SvtVoid"

@genType
let getTag = (variant: squiggleValue) =>
  switch variant {
  | IEvArray(_) => svtArray_
  | IEvArrayString(_) => svtArrayString_
  | IEvBool(_) => svtBool_
  | IEvCall(_) => svtCall_ //Impossible
  | IEvDate(_) => svtDate_
  | IEvDeclaration(_) => svtDeclaration_
  | IEvDistribution(_) => svtDistribution_
  | IEvLambda(_) => svtLambda_
  | IEvBindings(_) => svtModule_ //Impossible
  | IEvNumber(_) => svtNumber_
  | IEvRecord(_) => svtRecord_
  | IEvString(_) => svtString_
  | IEvSymbol(_) => svtSymbol_
  | IEvTimeDuration(_) => svtTimeDuration_
  | IEvType(_) => svtType_
  | IEvTypeIdentifier(_) => svtTypeIdentifier_
  | IEvVoid => svtVoid_
  }

@genType
let toString = (variant: squiggleValue) =>
  ReducerInterface_InternalExpressionValue.toString(variant)

@genType
let getArray = (variant: squiggleValue): option<squiggleValue_Array> =>
  //FIXME: Convert
  switch variant {
  | IEvArray(arrayLike) => arrayLike->Some
  | _ => None
  }

@genType
let getArrayString = (variant: squiggleValue): option<array<string>> =>
  switch variant {
  | IEvArrayString(value) => value->Some
  | _ => None
  }

@genType
let getBool = (variant: squiggleValue): option<bool> =>
  switch variant {
  | IEvBool(value) => value->Some
  | _ => None
  }

@genType
let getCall = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvCall(value) => value->Some
  | _ => None
  }

@genType
let getDate = (variant: squiggleValue): option<Js.Date.t> =>
  switch variant {
  | IEvDate(value) => value->Some
  | _ => None
  }

@genType
let getDeclaration = (variant: squiggleValue): option<squiggleValue_Declaration> =>
  switch variant {
  | IEvDeclaration(value) => value->Some
  | _ => None
  }

@genType
let getDistribution = (variant: squiggleValue): option<squiggleValue_Distribution> =>
  switch variant {
  | IEvDistribution(value) => value->Some
  | _ => None
  }

@genType
let getLambda = (variant: squiggleValue): option<squiggleValue_Lambda> =>
  switch variant {
  | IEvLambda(value) => value->Some
  | _ => None
  }

@genType
let getModule = (variant: squiggleValue): option<squiggleValue_Module> =>
  switch variant {
  | IEvBindings(value) => value->Some
  | _ => None
  }

@genType
let getNumber = (variant: squiggleValue): option<float> =>
  switch variant {
  | IEvNumber(value) => value->Some
  | _ => None
  }

@genType
let getRecord = (variant: squiggleValue): option<squiggleValue_Record> =>
  switch variant {
  | IEvRecord(value) => value->Some
  | _ => None
  }

@genType
let getString = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvString(value) => value->Some
  | _ => None
  }

@genType
let getSymbol = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvSymbol(value) => value->Some
  | _ => None
  }

@genType
let getTimeDuration = (variant: squiggleValue): option<float> =>
  switch variant {
  | IEvTimeDuration(value) => value->Some
  | _ => None
  }

@genType
let getType = (variant: squiggleValue): option<squiggleValue_Type> =>
  switch variant {
  | IEvType(value) => value->Some
  | _ => None
  }

@genType
let getTypeIdentifier = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvTypeIdentifier(value) => value->Some
  | _ => None
  }
