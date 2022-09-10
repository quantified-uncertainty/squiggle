module BBindingsReplacer = Reducer_Expression_BindingsReplacer
module BErrorValue = Reducer_ErrorValue
module T = Reducer_Expression_T
module BInternalExpressionValue = ReducerInterface_InternalExpressionValue
module BBindings = Reducer_Bindings

type errorValue = BErrorValue.errorValue
type expression = T.expression
type expressionOrFFI = T.expressionOrFFI
type ffiFn = T.ffiFn
type internalCode = ReducerInterface_InternalExpressionValue.internalCode

let eArray = anArray => anArray->BInternalExpressionValue.IEvArray->T.EValue

let eArrayString = anArray => anArray->BInternalExpressionValue.IEvArrayString->T.EValue

let eBindings = (anArray: array<(string, BInternalExpressionValue.t)>) =>
  anArray->BBindings.fromArray->BBindings.toExpressionValue->T.EValue

let eBool = aBool => aBool->BInternalExpressionValue.IEvBool->T.EValue

let eCall = (name: string): expression =>
  name->BInternalExpressionValue.IEvCall->T.EValue

let eFunction = (fName: string, lispArgs: list<expression>): expression => {
  let fn = fName->eCall
  list{fn, ...lispArgs}->T.EList
}

let eLambda = (
  parameters: array<string>,
  expr: expression,
) => {
  T.ELambda(parameters, expr)

let eNumber = aNumber => aNumber->BInternalExpressionValue.IEvNumber->T.EValue

let eRecord = aMap => aMap->BInternalExpressionValue.IEvRecord->T.EValue

let eString = aString => aString->BInternalExpressionValue.IEvString->T.EValue

let eSymbol = (name: string): expression =>
  T.ESymbol(name)

let eBlock = (exprs: array<expression>): expression =>
  T.EBlock(exprs)

let eModule = (nameSpace: BInternalExpressionValue.nameSpace): expression =>
  nameSpace->BInternalExpressionValue.IEvBindings->T.EValue

let eLetStatement = (symbol: string, valueExpression: expression): expression =>
  T.EAssign(symbol, valueExpression)

let eTernary = (predicate: expression, trueCase: expression, falseCase: expression): expression =>
  T.ETernary(predicate, trueCase, falseCase)

let eIdentifier = (name: string): expression =>
  name->BInternalExpressionValue.IEvSymbol->T.EValue

let eTypeIdentifier = (name: string): expression =>
  name->BInternalExpressionValue.IEvTypeIdentifier->T.EValue

let eVoid: expression = BInternalExpressionValue.IEvVoid->T.EValue
