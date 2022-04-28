@genType
type errorValue =
  | REArrayIndexNotFound(string, int)
  | REAssignmentExpected
  | REExpressionExpected
  | REFunctionExpected(string)
  | REJavaScriptExn(option<string>, option<string>) // Javascript Exception
  | REMacroNotFound(string)
  | RERecordPropertyNotFound(string, string)
  | RESymbolNotFound(string)
  | RESyntaxError(string)
  | REDistributionError(DistributionTypes.error)
  | RETodo(string) // To do

type t = errorValue

@genType
let errorToString = err =>
  switch err {
  | REArrayIndexNotFound(msg, index) => `${msg}: ${Js.String.make(index)}`
  | REAssignmentExpected => "Assignment expected"
  | REExpressionExpected => "Expression expected"
  | REFunctionExpected(msg) => `Function expected: ${msg}`
  | REDistributionError(err) => `Distribution Math Error: ${DistributionTypes.Error.toString(err)}`
  | REJavaScriptExn(omsg, oname) => {
      let answer = "JS Exception:"
      let answer = switch oname {
      | Some(name) => `${answer} ${name}`
      | _ => answer
      }
      let answer = switch omsg {
      | Some(msg) => `${answer}: ${msg}`
      | _ => answer
      }
      answer
    }
  | REMacroNotFound(macro) => `Macro not found: ${macro}`
  | RERecordPropertyNotFound(msg, index) => `${msg}: ${index}`
  | RESymbolNotFound(symbolName) => `${symbolName} is not defined`
  | RESyntaxError(desc) => `Syntax Error: ${desc}`
  | RETodo(msg) => `TODO: ${msg}`
  }
