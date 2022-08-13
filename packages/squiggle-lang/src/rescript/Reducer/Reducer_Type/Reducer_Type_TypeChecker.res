module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module T = Reducer_Type_T
module TypeContracts = Reducer_Type_Contracts
open InternalExpressionValue

let rec isITypeOf = (anIType: T.iType, aValue): result<bool, T.typeErrorValue> => {
  let caseTypeIdentifier = (anUpperTypeName, aValue) => {
    let aTypeName = anUpperTypeName->Js.String2.toLowerCase
    switch aTypeName {
    | "any" => Ok(true)
    | _ => {
        let valueTypeName = aValue->valueToValueType->valueTypeToString->Js.String2.toLowerCase
        switch aTypeName == valueTypeName {
        | true => Ok(true)
        | false => T.TypeMismatch(anIType, aValue)->Error
        }
      }
    }
  }

  let caseRecord = (anIType, propertyMap: Belt.Map.String.t<T.iType>, evValue) =>
    switch evValue {
    | IEvRecord(aRecord) =>
      if (
        Js.Array2.length(propertyMap->Belt.Map.String.keysToArray) ==
          Js.Array2.length(aRecord->Belt.Map.String.keysToArray)
      ) {
        Belt.Map.String.reduce(propertyMap, Ok(true), (acc, property, propertyType) => {
          Belt.Result.flatMap(acc, _ =>
            switch Belt.Map.String.get(aRecord, property) {
            | Some(propertyValue) => isITypeOf(propertyType, propertyValue)
            | None => T.TypeMismatch(anIType, evValue)->Error
            }
          )
        })
      } else {
        T.TypeMismatch(anIType, evValue)->Error
      }

    | _ => T.TypeMismatch(anIType, evValue)->Error
    }

  let caseArray = (anIType, elementType, evValue) =>
    switch evValue {
    | IEvArray(anArray) =>
      Belt.Array.reduce(anArray, Ok(true), (acc, element) =>
        Belt.Result.flatMap(acc, _ =>
          switch isITypeOf(elementType, element) {
          | Ok(_) => Ok(true)
          | Error(error) => error->Error
          }
        )
      )
    | _ => T.TypeMismatch(anIType, evValue)->Error
    }

  let caseTuple = (anIType, elementTypes, evValue) =>
    switch evValue {
    | IEvArray(anArray) =>
      if Js.Array2.length(elementTypes) == Js.Array2.length(anArray) {
        let zipped = Belt.Array.zip(elementTypes, anArray)
        Belt.Array.reduce(zipped, Ok(true), (acc, (elementType, element)) =>
          switch acc {
          | Ok(_) =>
            switch isITypeOf(elementType, element) {
            | Ok(_) => acc
            | Error(error) => Error(error)
            }
          | _ => acc
          }
        )
      } else {
        T.TypeMismatch(anIType, evValue)->Error
      }
    | _ => T.TypeMismatch(anIType, evValue)->Error
    }

  let caseOr = (anIType, anITypeArray, evValue) =>
    switch Belt.Array.reduce(anITypeArray, Ok(false), (acc, anIType) =>
      Belt.Result.flatMap(acc, _ =>
        switch acc {
        | Ok(false) =>
          switch isITypeOf(anIType, evValue) {
          | Ok(_) => Ok(true)
          | Error(_) => acc
          }
        | _ => acc
        }
      )
    ) {
    | Ok(true) => Ok(true)
    | Ok(false) => T.TypeMismatch(anIType, evValue)->Error
    | Error(error) => Error(error)
    }

  let caseModifiedType = (
    anIType: T.iType,
    modifiedType: T.iType,
    contracts: Belt.Map.String.t<InternalExpressionValue.t>,
    aValue: InternalExpressionValue.t,
  ) => {
    isITypeOf(modifiedType, aValue)->Belt.Result.flatMap(_result => {
      if TypeContracts.checkModifiers(contracts, aValue) {
        Ok(true)
      } else {
        T.TypeMismatch(anIType, aValue)->Error
      }
    })
  }

  switch anIType {
  | ItTypeIdentifier(name) => caseTypeIdentifier(name, aValue)
  | ItModifiedType({modifiedType, contracts}) =>
    caseModifiedType(anIType, modifiedType, contracts, aValue) //{modifiedType: iType, contracts: Belt.Map.String.t<InternalExpressionValue.t>}
  | ItTypeOr({typeOr}) => caseOr(anIType, typeOr, aValue)
  | ItTypeFunction(_) =>
    raise(
      Reducer_Exception.ImpossibleException(
        "Reducer_TypeChecker-functions are without a type at the moment",
      ),
    )
  | ItTypeArray({element}) => caseArray(anIType, element, aValue)
  | ItTypeTuple({elements}) => caseTuple(anIType, elements, aValue)
  | ItTypeRecord({properties}) => caseRecord(anIType, properties, aValue)
  }
}

let isTypeOf = (
  typeExpressionSourceCode: string,
  aValue: InternalExpressionValue.t,
  reducerFn: ExpressionT.reducerFn,
): result<InternalExpressionValue.t, ErrorValue.t> => {
  switch typeExpressionSourceCode->Reducer_Type_Compile.fromTypeExpression(reducerFn) {
  | Ok(anIType) =>
    switch isITypeOf(anIType, aValue) {
    | Ok(_) => Ok(aValue)
    | Error(T.TypeMismatch(anIType, evValue)) =>
      Error(
        ErrorValue.REExpectedType(anIType->T.toString, evValue->InternalExpressionValue.toString),
      )
    }
  | Error(error) => Error(error) // Directly propagating - err => err - causes type mismatch
  }
}

let checkITypeArguments = (anIType: T.iType, args: array<InternalExpressionValue.t>): result<
  bool,
  T.typeErrorValue,
> => {
  switch anIType {
  | T.ItTypeFunction({inputs}) => isITypeOf(T.ItTypeTuple({elements: inputs}), args->IEvArray)
  | _ => T.TypeMismatch(anIType, args->IEvArray)->Error
  }
}

let checkITypeArgumentsBool = (anIType: T.iType, args: array<InternalExpressionValue.t>): bool => {
  switch checkITypeArguments(anIType, args) {
  | Ok(_) => true
  | _ => false
  }
}

let checkArguments = (
  typeExpressionSourceCode: string,
  args: array<InternalExpressionValue.t>,
  reducerFn: ExpressionT.reducerFn,
): result<InternalExpressionValue.t, ErrorValue.t> => {
  switch typeExpressionSourceCode->Reducer_Type_Compile.fromTypeExpression(reducerFn) {
  | Ok(anIType) =>
    switch checkITypeArguments(anIType, args) {
    | Ok(_) => Ok(args->IEvArray)
    | Error(T.TypeMismatch(anIType, evValue)) =>
      Error(
        ErrorValue.REExpectedType(anIType->T.toString, evValue->InternalExpressionValue.toString),
      )
    }
  | Error(error) => Error(error) // Directly propagating - err => err - causes type mismatch
  }
}
