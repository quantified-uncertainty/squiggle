// type rec iType =
//   | ItTypeIdentifier(string)
//   | ItModifiedType({modifiedType: iType, contracts: Belt.Map.String.t<Reducer_Value.t>})
//   | ItTypeOr({typeOr: array<iType>})
//   | ItTypeFunction({inputs: array<iType>, output: iType})
//   | ItTypeArray({element: iType})
//   | ItTypeTuple({elements: array<iType>})
//   | ItTypeRecord({properties: Belt.Map.String.t<iType>})

// type t = iType
// type typeErrorValue = TypeMismatch(t, Reducer_Value.t)

// let rec toString = (t: t): string => {
//   switch t {
//   | ItTypeIdentifier(s) => s
//   | ItModifiedType({modifiedType, contracts}) =>
//     `${toString(modifiedType)}${contracts->Belt.Map.String.reduce("", (acc, k, v) =>
//         Js.String2.concatMany(acc, ["<-", k, "(", Reducer_Value.toString(v), ")"])
//       )}`
//   | ItTypeOr({typeOr}) => `(${Js.Array2.map(typeOr, toString)->Js.Array2.joinWith(" | ")})`
//   | ItTypeFunction({inputs, output}) =>
//     `(${inputs->Js.Array2.map(toString)->Js.Array2.joinWith(" => ")} => ${toString(output)})`
//   | ItTypeArray({element}) => `[${toString(element)}]`
//   | ItTypeTuple({elements}) => `[${Js.Array2.map(elements, toString)->Js.Array2.joinWith(", ")}]`
//   | ItTypeRecord({properties}) =>
//     `{${properties
//       ->Belt.Map.String.toArray
//       ->Js.Array2.map(((k, v)) => Js.String2.concatMany(k, [": ", toString(v)]))
//       ->Js.Array2.joinWith(", ")}}`
//   }
// }

// let toStringResult = (rt: result<t, ErrorValue.t>) =>
//   switch rt {
//   | Ok(t) => toString(t)
//   | Error(e) => ErrorValue.errorToString(e)
//   }

// let rec fromTypeMap = typeMap => {
//   let default = IEvString("")
//   let evTypeTag: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "typeTag",
//     default,
//   )
//   let evTypeIdentifier: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "typeIdentifier",
//     default,
//   )
//   let evTypeOr: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "typeOr",
//     default,
//   )
//   let evInputs: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "inputs",
//     default,
//   )
//   let evOutput: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "output",
//     default,
//   )
//   let evElement: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "element",
//     default,
//   )
//   let evElements: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "elements",
//     default,
//   )
//   let evProperties: Reducer_Value.t = Belt.Map.String.getWithDefault(
//     typeMap,
//     "properties",
//     default,
//   )

//   let contracts =
//     typeMap->Belt.Map.String.keep((k, _v) => ["min", "max", "memberOf"]->Js.Array2.includes(k))

//   let makeIt = switch evTypeTag {
//   | IEvString("typeIdentifier") => fromIEvValue(evTypeIdentifier)
//   | IEvString("typeOr") => ItTypeOr({typeOr: fromIEvArray(evTypeOr)})
//   | IEvString("typeFunction") =>
//     ItTypeFunction({inputs: fromIEvArray(evInputs), output: fromIEvValue(evOutput)})
//   | IEvString("typeArray") => ItTypeArray({element: fromIEvValue(evElement)})
//   | IEvString("typeTuple") => ItTypeTuple({elements: fromIEvArray(evElements)})
//   | IEvString("typeRecord") => ItTypeRecord({properties: fromIEvRecord(evProperties)})
//   | _ => raise(Reducer_Exception.ImpossibleException("Reducer_Type_T-evTypeTag"))
//   }

//   Belt.Map.String.isEmpty(contracts)
//     ? makeIt
//     : ItModifiedType({modifiedType: makeIt, contracts: contracts})
// }

// and fromIEvValue = (ievValue: Reducer_Value.t): iType =>
//   switch ievValue {
//   | IEvTypeIdentifier(typeIdentifier) => ItTypeIdentifier({typeIdentifier})
//   | IEvType(typeMap) => fromTypeMap(typeMap)
//   | _ => raise(Reducer_Exception.ImpossibleException("Reducer_Type_T-ievValue"))
//   }
// and fromIEvArray = (ievArray: Reducer_Value.t) =>
//   switch ievArray {
//   | IEvArray(array) => array->Belt.Array.map(fromIEvValue)
//   | _ => raise(Reducer_Exception.ImpossibleException("Reducer_Type_T-ievArray"))
//   }
// and fromIEvRecord = (ievRecord: Reducer_Value.t) =>
//   switch ievRecord {
//   | IEvRecord(record) => record->Belt.Map.String.map(fromIEvValue)
//   | _ => raise(Reducer_Exception.ImpossibleException("Reducer_Type_T-ievRecord"))
//   }

