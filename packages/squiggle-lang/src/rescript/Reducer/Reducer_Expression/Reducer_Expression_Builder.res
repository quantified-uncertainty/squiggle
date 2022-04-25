module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result

type errorValue = ErrorValue.errorValue
type expression = ExpressionT.expression

let passToFunction = (fName: string, lispArgs: list<expression>): expression => {
  let toEvCallValue = (name: string): expression => name->ExpressionValue.EvCall->ExpressionT.EValue
  let fn = fName->toEvCallValue
  list{fn, ...lispArgs}->ExpressionT.EList
}

let toEvSymbolValue = (name: string): expression =>
  name->ExpressionValue.EvSymbol->ExpressionT.EValue
