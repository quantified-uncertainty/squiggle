include Reducer_Manager_Module

open ReducerInterface_ExpressionValue

let emptyBindings = emptyModule

let toExpressionValue = (container: t): expressionValue => EvRecord(toRecord(container))
let fromExpressionValue = (aValue: expressionValue): t =>
  switch aValue {
  | EvRecord(r) => fromRecord(r)
  | _ => emptyBindings
  }
