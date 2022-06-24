module ErrorValue = Reducer_ErrorValue
module Expression = Reducer_Expression

@genType
type environment = ReducerInterface_ExternalExpressionValue.environment
@genType
type errorValue = Reducer_ErrorValue.errorValue
@genType
type expressionValue = ReducerInterface_ExternalExpressionValue.t
@genType
type externalBindings = ReducerInterface_ExternalExpressionValue.externalBindings
@genType
type lambdaValue = ReducerInterface_ExternalExpressionValue.lambdaValue

@genType
let evaluateUsingOptions: (
  ~environment: option<QuriSquiggleLang.ReducerInterface_ExternalExpressionValue.environment>,
  ~externalBindings: option<
    QuriSquiggleLang.ReducerInterface_ExternalExpressionValue.externalBindings,
  >,
  string,
) => result<expressionValue, errorValue>
@genType
let evaluatePartialUsingExternalBindings: (
  string,
  QuriSquiggleLang.ReducerInterface_ExternalExpressionValue.externalBindings,
  QuriSquiggleLang.ReducerInterface_ExternalExpressionValue.environment,
) => result<externalBindings, errorValue>
@genType
let evaluate: string => result<expressionValue, errorValue>

let parse: string => result<Expression.expression, errorValue>

@genType
let foreignFunctionInterface: (
  QuriSquiggleLang.ReducerInterface_ExternalExpressionValue.lambdaValue,
  array<QuriSquiggleLang.ReducerInterface_ExternalExpressionValue.t>,
  QuriSquiggleLang.ReducerInterface_ExternalExpressionValue.environment,
) => result<expressionValue, errorValue>

@genType
let defaultEnvironment: environment

@genType
let defaultExternalBindings: externalBindings
