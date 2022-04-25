module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result

type errorValue = ErrorValue.errorValue
type expression = ExpressionT.expression

let toEvCallValue = (name: string): expression => ExpressionT.EValue(ExpressionValue.EvCall(name))

let toEvSymbolValue = (name: string): expression => ExpressionT.EValue(
  ExpressionValue.EvSymbol(name),
)

//From Ozzie: I think this could really use a more descriptive name.
let passToFunction = (fName: string, lispArgs: list<expression>): expression => {
  let fn = toEvCallValue(fName)
  ExpressionT.EList(list{fn, ...lispArgs})
}