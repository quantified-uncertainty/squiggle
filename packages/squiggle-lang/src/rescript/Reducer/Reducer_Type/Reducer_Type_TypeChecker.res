//TODO: Work in progress. Code is commented to make an a release of other features

module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module T = Reducer_Type_T
module TypeBuilder = Reducer_Type_TypeBuilder
open InternalExpressionValue

type typeErrorValue =
  | TypeError(T.iType, InternalExpressionValue.t)
  | TypeErrorWithPosition(T.iType, InternalExpressionValue.t, int)
  | TypeErrorWithProperty(T.iType, InternalExpressionValue.t, string)

let rec isOfResolvedIType = (anIType: T.iType, aValue): result<bool, typeErrorValue> => {
  let caseTypeIdentifier = (anUpperTypeName, aValue) => {
    let aTypeName = anUpperTypeName->Js.String2.toLowerCase
    let valueTypeName = aValue->valueToValueType->valueTypeToString->Js.String2.toLowerCase
    switch aTypeName === valueTypeName {
    | true => Ok(true)
    | false => TypeError(anIType, aValue)->Error
    }
  }

  let _caseRecord = (anIType, evValue, propertyMap, map) => {
    Belt.Map.String.reduce(propertyMap, Ok(true), (acc, property, propertyType) => {
      Belt.Result.flatMap(acc, _ =>
        switch Belt.Map.String.get(map, property) {
        | Some(propertyValue) => isOfResolvedIType(propertyType, propertyValue)
        | None => TypeErrorWithProperty(anIType, evValue, property)->Error
        }
      )
    })
  }
  let _caseArray = (anIType, evValue, elementType, anArray) => {
    Belt.Array.reduceWithIndex(anArray, Ok(true), (acc, element, index) => {
      switch isOfResolvedIType(elementType, element) {
      | Ok(_) => acc
      | Error(_) => TypeErrorWithPosition(anIType, evValue, index)->Error
      }
    })
  }

  switch anIType {
  | ItTypeIdentifier(name) => caseTypeIdentifier(name, aValue)
  // | ItModifiedType({modifiedType: anIType}) => raise(Reducer_Exception.ImpossibleException)
  // | ItTypeOr({typeOr: anITypeArray}) => raise(Reducer_Exception.ImpossibleException)
  // | ItTypeFunction({inputs: anITypeArray, output: anIType}) =>
  //   raise(Reducer_Exception.ImpossibleException)
  // | ItTypeArray({element: anIType}) => raise(Reducer_Exception.ImpossibleException)
  // | ItTypeTuple({elements: anITypeArray}) => raise(Reducer_Exception.ImpossibleException)
  // | ItTypeRecord({properties: anITypeMap}) => raise(Reducer_Exception.ImpossibleException)
  | _ => raise(Reducer_Exception.ImpossibleException)
  }
}

let isOfResolvedType = (aType: InternalExpressionValue.t, aValue): result<bool, typeErrorValue> =>
  aType->T.fromIEvValue->isOfResolvedIType(aValue)

// let checkArguments = (
//   evFunctionType: InternalExpressionValue.t,
//   args: array<InternalExpressionValue.t>,
// ) => {
//   let functionType = switch evFunctionType {
//   | IEvRecord(functionType) => functionType
//   | _ => raise(Reducer_Exception.ImpossibleException)
//   }
//   let evInputs = functionType->Belt.Map.String.getWithDefault("inputs", []->IEvArray)
//   let inputs = switch evInputs {
//   | IEvArray(inputs) => inputs
//   | _ => raise(Reducer_Exception.ImpossibleException)
//   }
//   let rTupleType = TypeBuilder.typeTuple(inputs)
//   Belt.Result.flatMap(rTupleType, tuppleType => isOfResolvedType(tuppleType, args->IEvArray))
// }

// let compileTypeExpression = (typeExpression: string, bindings: ExpressionT.bindings, reducerFn: ExpressionT.reducerFn) => {
//     statement = `type compiled=${typeExpression}`

// }

//TODO: asGuard
