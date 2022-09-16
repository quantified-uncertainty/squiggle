module BErrorValue = Reducer_ErrorValue
module T = Reducer_T

type errorValue = BErrorValue.errorValue
type expression = Reducer_T.expression

let eArray = (anArray: array<T.expression>) => anArray->T.EArray

let eArrayString = anArray => anArray->T.IEvArrayString->T.EValue

let eBool = aBool => aBool->T.IEvBool->T.EValue

let eCall = (fn: expression, args: array<expression>): expression => T.ECall(fn, args)

let eLambda = (parameters: array<string>, expr: expression) => T.ELambda(parameters, expr)

let eNumber = aNumber => aNumber->T.IEvNumber->T.EValue

let eRecord = (aMap: array<(T.expression, T.expression)>) => aMap->T.ERecord

let eString = aString => aString->T.IEvString->T.EValue

let eSymbol = (name: string): expression => T.ESymbol(name)

let eBlock = (exprs: array<expression>): expression => T.EBlock(exprs)

let eProgram = (exprs: array<expression>): expression => T.EProgram(exprs)

let eLetStatement = (symbol: string, valueExpression: expression): expression => T.EAssign(
  symbol,
  valueExpression,
)

let eTernary = (
  predicate: expression,
  trueCase: expression,
  falseCase: expression,
): expression => T.ETernary(predicate, trueCase, falseCase)

let eIdentifier = (name: string): expression => name->T.ESymbol

// let eTypeIdentifier = (name: string): expression =>
//   name->T.IEvTypeIdentifier->T.EValue

let eVoid: expression = T.IEvVoid->T.EValue
