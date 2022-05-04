module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression

@genType
type environment = ReducerInterface_ExpressionValue.environment
@genType
type errorValue = Reducer_ErrorValue.errorValue
@genType
type expressionValue = ReducerInterface_ExpressionValue.expressionValue
@genType
type externalBindings = ReducerInterface_ExpressionValue.externalBindings
@genType
type lambdaValue = ReducerInterface_ExpressionValue.lambdaValue


@genType
let evaluateUsingOptions: (
  ~environment: option<QuriSquiggleLang.ReducerInterface_ExpressionValue.environment>,
  ~externalBindings: option<QuriSquiggleLang.ReducerInterface_ExpressionValue.externalBindings>,
  string,
) => result<expressionValue, errorValue>
@genType
let evaluatePartialUsingExternalBindings: (
  string,
  QuriSquiggleLang.ReducerInterface_ExpressionValue.externalBindings,
  QuriSquiggleLang.ReducerInterface_ExpressionValue.environment,
) => result<externalBindings, errorValue>
@genType
let evaluate: string => result<expressionValue, errorValue>

let parse: string => result<Expression.expression, errorValue>

@genType
let foreignFunctionInterface: (
  QuriSquiggleLang.ReducerInterface_ExpressionValue.lambdaValue,
  array<QuriSquiggleLang.ReducerInterface_ExpressionValue.expressionValue>,
  QuriSquiggleLang.ReducerInterface_ExpressionValue.environment,
) => result<expressionValue, errorValue>

@genType
let defaultEnvironment: environment

@genType
let defaultExternalBindings: externalBindings
