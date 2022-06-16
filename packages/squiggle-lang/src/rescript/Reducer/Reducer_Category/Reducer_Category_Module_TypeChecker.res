module ExpressionValue = ReducerInterface_InternalExpressionValue
module ExpressionT = Reducer_Expression_T
open ExpressionValue

let isOfResolvedType = (aType, aValue) => {
  let caseTypeIdentifier = (aTypeIdentifier0, aValue) => {
    let valueType = aValue->valueToValueType->valueTypeToString->Js.String2.toLowerCase
    let aTypeIdentifier = aTypeIdentifier0->Js.String2.toLowerCase
    aTypeIdentifier === valueType
  }

  switch aType {
  | IevTypeIdentifier(aTypeIdentifier) => caseTypeIdentifier(aTypeIdentifier, aValue)
  | _ => false
  }
}

// let compileTypeExpression = (typeExpression: string, bindings: ExpressionT.bindings, reducerFn: ExpressionT.reducerFn) => {
//     statement = `type compiled=${typeExpression}`

// }
