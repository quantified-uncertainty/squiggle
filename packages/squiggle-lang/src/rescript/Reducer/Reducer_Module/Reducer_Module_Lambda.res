module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
open Reducer_ErrorValue
open ReducerInterface_InternalExpressionValue

type expression = ExpressionT.expression

let defaultCase = (call: functionCall) =>
  REFunctionNotFound(call->functionCallToCallSignature->functionCallSignatureToString)->Error

let defaultCaseFFIFn = (functionName: string): ExpressionT.ffiFn => {
  (args: array<internalExpressionValue>, _environment: environment): result<
    internalExpressionValue,
    errorValue,
  > => {
    let call = (functionName, args)
    defaultCase(call)
  }
}

let defaultCaseFFI = (functionName: string): expression => {
  ExpressionBuilder.eLambdaFFI(defaultCaseFFIFn(functionName))
}

let addGuard = (
  guard: expression,
  expression: expression,
  previousExpression: expression,
): expression => ExpressionBuilder.eTernary(guard, expression, previousExpression)
