module Parse = Reducer_Peggy_Parse
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module ExternalExpressionValue = ReducerInterface_ExternalExpressionValue
open Reducer_ErrorValue

type sourceArgumentType = string
type sourceType = string
type rawParseArgumentType = result<Parse.node, errorValue>
type rawParseType = option<rawParseArgumentType>
type expressionArgumentType = result<ExpressionT.t, errorValue>
type expressionType = option<expressionArgumentType>
type continuation = InternalExpressionValue.nameSpace
type continuationArgumentType = InternalExpressionValue.nameSpace
type continuationType = option<continuationArgumentType>
type continuationResultType = option<result<continuationArgumentType, errorValue>>
type externalBindingsArgumentType = ExternalExpressionValue.record
type externalBindingsType = option<externalBindingsArgumentType>
type resultArgumentType = result<InternalExpressionValue.t, errorValue>
type resultType = option<resultArgumentType>
type externalResultArgumentType = result<ExternalExpressionValue.t, errorValue>
type externalResultType = option<externalResultArgumentType>
type continuesArgumentType = array<string>
type continuesType = array<string>
type includesArgumentType = string
type includesType = result<array<string>, errorValue>

type projectItem =
  | ProjectItem({
      source: sourceType,
      rawParse: rawParseType,
      expression: expressionType,
      continuation: continuationArgumentType,
      result: resultType,
      continues: continuesType,
      includes: includesType,
    })

type t = projectItem
