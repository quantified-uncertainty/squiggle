open ForTS_Types_

@genType
let getResult = (_p: myProject): option<result_<internalValue, errorValue>> =>
  My_ErrorValue.EError->Error->Some
