module Parse = Reducer_Peggy_Parse
module ExpressionT = Reducer_Expression_T
open Reducer_ErrorValue

type sourceArgumentType = string
type sourceType = string
type rawParseArgumentType = result<Parse.node, errorValue>
type rawParseType = option<rawParseArgumentType>
type expressionArgumentType = result<ExpressionT.t, errorValue>
type expressionType = option<expressionArgumentType>
type continuation = Reducer_T.nameSpace
type continuationArgumentType = Reducer_T.nameSpace
type continuationType = option<continuationArgumentType>
type continuationResultType = option<result<continuationArgumentType, errorValue>>
type bindingsArgumentType = Reducer_T.nameSpace
type bindingsType = option<bindingsArgumentType>
type resultArgumentType = result<Reducer_T.value, errorValue>
type resultType = option<resultArgumentType>
type continuesArgumentType = array<string>
type continuesType = array<string>
type includesArgumentType = string
type includesType = result<array<string>, errorValue>
type importAsVariablesType = array<(string, string)>

type projectItem = {
  source: sourceType,
  rawParse: rawParseType,
  expression: expressionType,
  continuation: continuationArgumentType,
  result: resultType,
  continues: continuesType,
  includes: includesType, //For loader
  includeAsVariables: importAsVariablesType, //For linker
  directIncludes: array<string>,
}

type t = projectItem
