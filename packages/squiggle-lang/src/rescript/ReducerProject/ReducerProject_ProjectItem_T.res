module Parse = Reducer_Peggy_Parse
module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
open Reducer_ErrorValue

type sourceArgumentType = string
type idArgumentType = string
type sourceType = string
type rawParseArgumentType = result<Parse.node, errorValue>
type rawParseType = option<rawParseArgumentType>
type expressionArgumentType = result<ExpressionT.t, errorValue>
type expressionType = option<expressionArgumentType>
type continuation = InternalExpressionValue.nameSpace
type continuationArgumentType = InternalExpressionValue.nameSpace
type continuationType = option<continuationArgumentType>
type continuationResultType = option<result<continuationArgumentType, errorValue>>
type bindingsArgumentType = InternalExpressionValue.nameSpace
type bindingsType = option<bindingsArgumentType>
type resultArgumentType = result<InternalExpressionValue.t, errorValueWithSource>
type resultType = option<resultArgumentType>
type continuesArgumentType = array<string>
type continuesType = array<string>
type includesArgumentType = string
type includesType = result<array<string>, errorValueWithSource>
type importAsVariablesType = array<(string, string)>

type projectItem =
  | ProjectItem({
      id: string,
      source: sourceType,
      rawParse: rawParseType,
      expression: expressionType,
      continuation: continuationArgumentType,
      result: resultType,
      continues: continuesType,
      includes: includesType, //For  loader
      includeAsVariables: importAsVariablesType, //For linker
      directIncludes: array<string>,
    }) //For linker

type t = projectItem
