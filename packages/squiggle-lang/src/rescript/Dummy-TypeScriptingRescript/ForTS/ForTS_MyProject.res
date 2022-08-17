open ForTS_Types

@genType
let getResult = (_p: myProject): option<result_internalValue> => My_ErrorValue.EError->Error->Some
