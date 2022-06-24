module BBindingsReplacer = Reducer_Expression_BindingsReplacer
module BErrorValue = Reducer_ErrorValue
module BExpressionT = Reducer_Expression_T
module BInternalExpressionValue = ReducerInterface_InternalExpressionValue
module BModule = Reducer_Category_Module

type errorValue = BErrorValue.errorValue
type expression = BExpressionT.expression
type expressionOrFFI = BExpressionT.expressionOrFFI
type ffiFn = BExpressionT.ffiFn
type internalCode = ReducerInterface_InternalExpressionValue.internalCode

external castExpressionToInternalCode: expressionOrFFI => internalCode = "%identity"

let eArray = anArray => anArray->BInternalExpressionValue.IEvArray->BExpressionT.EValue

let eArrayString = anArray => anArray->BInternalExpressionValue.IEvArrayString->BExpressionT.EValue

let eBindings = (anArray: array<(string, BInternalExpressionValue.t)>) =>
  anArray->BModule.fromArray->BModule.toExpressionValue->BExpressionT.EValue

let eBool = aBool => aBool->BInternalExpressionValue.IEvBool->BExpressionT.EValue

let eCall = (name: string): expression =>
  name->BInternalExpressionValue.IEvCall->BExpressionT.EValue

let eFunction = (fName: string, lispArgs: list<expression>): expression => {
  let fn = fName->eCall
  list{fn, ...lispArgs}->BExpressionT.EList
}

let eLambda = (
  parameters: array<string>,
  context: BInternalExpressionValue.nameSpace,
  expr: expression,
) => {
  BInternalExpressionValue.IEvLambda({
    parameters: parameters,
    context: context,
    body: NotFFI(expr)->castExpressionToInternalCode,
  })->BExpressionT.EValue
}

let eLambdaFFI = (parameters: array<string>, ffiFn: ffiFn) => {
  let context = BModule.emptyModule
  BInternalExpressionValue.IEvLambda({
    parameters: parameters,
    context: context,
    body: FFI(ffiFn)->castExpressionToInternalCode,
  })->BExpressionT.EValue
}

let eNumber = aNumber => aNumber->BInternalExpressionValue.IEvNumber->BExpressionT.EValue

let eRecord = aMap => aMap->BInternalExpressionValue.IEvRecord->BExpressionT.EValue

let eString = aString => aString->BInternalExpressionValue.IEvString->BExpressionT.EValue

let eSymbol = (name: string): expression =>
  name->BInternalExpressionValue.IEvSymbol->BExpressionT.EValue

let eList = (list: list<expression>): expression => list->BExpressionT.EList

let eBlock = (exprs: list<expression>): expression => eFunction("$$_block_$$", exprs)

let eModule = (nameSpace: BInternalExpressionValue.nameSpace): expression =>
  nameSpace->BInternalExpressionValue.IEvModule->BExpressionT.EValue

let eLetStatement = (symbol: string, valueExpression: expression): expression =>
  eFunction("$_let_$", list{eSymbol(symbol), valueExpression})

let eBindStatement = (bindingExpr: expression, letStatement: expression): expression =>
  eFunction("$$_bindStatement_$$", list{bindingExpr, letStatement})

let eBindStatementDefault = (letStatement: expression): expression =>
  eFunction("$$_bindStatement_$$", list{letStatement})

let eBindExpression = (bindingExpr: expression, expression: expression): expression =>
  eFunction("$$_bindExpression_$$", list{bindingExpr, expression})

let eBindExpressionDefault = (expression: expression): expression =>
  eFunction("$$_bindExpression_$$", list{expression})

let eIdentifier = (name: string): expression =>
  name->BInternalExpressionValue.IEvSymbol->BExpressionT.EValue

let eTypeIdentifier = (name: string): expression =>
  name->BInternalExpressionValue.IEvTypeIdentifier->BExpressionT.EValue
