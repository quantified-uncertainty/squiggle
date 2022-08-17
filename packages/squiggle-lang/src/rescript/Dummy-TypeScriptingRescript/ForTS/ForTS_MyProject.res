open ForTS_Types

@genType
let getResult = (_p: myProject): option<result_<internalValue, errorValue>> =>
  My_ErrorValue.EError->Error->Some
