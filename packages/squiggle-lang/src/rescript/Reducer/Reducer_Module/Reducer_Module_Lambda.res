module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
// open ReducerInterface_InternalExpressionValue

type expression = ExpressionT.expression

let defaultCaseFFI = (functionName: string): expression => {
  ExpressionBuilder.eLambdaFFI(Reducer_Module.functionNotFoundErrorFFIFn(functionName))
}

let addGuard = (
  guard: expression,
  expression: expression,
  previousExpression: expression,
): expression => ExpressionBuilder.eTernary(guard, expression, previousExpression)
