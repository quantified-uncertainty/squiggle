module InternalExpressionValue = ReducerInterface_InternalExpressionValue
open InternalExpressionValue

type rec iType =
  | ItTypeIdentifier(string)
  | ItModifiedType({modifiedType: iType})
  | ItTypeOr({typeOr: array<iType>})
  | ItTypeFunction({inputs: array<iType>, output: iType})
  | ItTypeArray({element: iType})
  | ItTypeTuple({elements: array<iType>})
  | ItTypeRecord({properties: Belt.Map.String.t<iType>})

let rec fromTypeMap = typeMap => {
  let default = IEvString("")
  let evTypeTag: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "typeTag",
    default,
  )
  let evTypeIdentifier: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "typeIdentifier",
    default,
  )
  let evTypeOr: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "typeOr",
    default,
  )
  let evInputs: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "inputs",
    default,
  )
  let evOutput: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "output",
    default,
  )
  let evElement: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "element",
    default,
  )
  let evElements: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "elements",
    default,
  )
  let evProperties: InternalExpressionValue.t = Belt.Map.String.getWithDefault(
    typeMap,
    "properties",
    default,
  )
  //TODO: map type modifiers
  switch evTypeTag {
  | IEvString("typeIdentifier") => ItModifiedType({modifiedType: fromIEvValue(evTypeIdentifier)})
  | IEvString("typeOr") => ItTypeOr({typeOr: fromIEvArray(evTypeOr)})
  | IEvString("typeFunction") =>
    ItTypeFunction({inputs: fromIEvArray(evInputs), output: fromIEvValue(evOutput)})
  | IEvString("typeArray") => ItTypeArray({element: fromIEvValue(evElement)})
  | IEvString("typeTuple") => ItTypeTuple({elements: fromIEvArray(evElements)})
  | IEvString("typeRecord") => ItTypeRecord({properties: fromIEvRecord(evProperties)})
  | _ => raise(Reducer_Exception.ImpossibleException)
  }
}
and fromIEvValue = (ievValue: InternalExpressionValue.t) =>
  switch ievValue {
  | IEvTypeIdentifier(typeIdentifier) => ItTypeIdentifier({typeIdentifier})
  | IEvType(typeMap) => fromTypeMap(typeMap)
  | _ => raise(Reducer_Exception.ImpossibleException)
  }
and fromIEvArray = (ievArray: InternalExpressionValue.t) =>
  switch ievArray {
  | IEvArray(array) => array->Belt.Array.map(fromIEvValue)
  | _ => raise(Reducer_Exception.ImpossibleException)
  }
and fromIEvRecord = (ievRecord: InternalExpressionValue.t) =>
  switch ievRecord {
  | IEvRecord(record) => record->Belt.Map.String.map(fromIEvValue)
  | _ => raise(Reducer_Exception.ImpossibleException)
  }
