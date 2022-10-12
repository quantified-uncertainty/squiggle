module T = Reducer_T

type expression = Reducer_T.expression
type expressionContent = Reducer_T.expressionContent

let eArray = (anArray: array<T.expression>): expressionContent => anArray->T.EArray

let eBool = aBool => aBool->T.IEvBool->T.EValue

let eCall = (fn: expression, args: array<expression>): expressionContent => T.ECall(fn, args)

let eLambda = (
  parameters: array<string>,
  expr: expression,
  name: option<string>,
): expressionContent => T.ELambda(parameters, expr, name)

let eNumber = aNumber => aNumber->T.IEvNumber->T.EValue

let eRecord = (aMap: array<(T.expression, T.expression)>) => aMap->T.ERecord

let eString = aString => aString->T.IEvString->T.EValue

let eSymbol = (name: string): expressionContent => T.ESymbol(name)

let eBlock = (exprs: array<expression>): expressionContent => T.EBlock(exprs)

let eProgram = (exprs: array<expression>): expressionContent => T.EProgram(exprs)

let eLetStatement = (symbol: string, valueExpression: expression): expressionContent => T.EAssign(
  symbol,
  valueExpression,
)

let eTernary = (
  predicate: expression,
  trueCase: expression,
  falseCase: expression,
): expressionContent => T.ETernary(predicate, trueCase, falseCase)

let eIdentifier = (name: string): expressionContent => name->T.ESymbol

let eVoid: expressionContent = T.IEvVoid->T.EValue
