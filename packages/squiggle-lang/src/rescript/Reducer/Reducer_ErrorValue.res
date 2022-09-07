//TODO: Do not export here but in ForTS__Types
@gentype.import("peggy") @genType.as("LocationRange")
type syntaxErrorLocation

@genType.opaque
type errorValue =
  | REArityError(option<string>, int, int)
  | REArrayIndexNotFound(string, int)
  | REAssignmentExpected
  | REDistributionError(DistributionTypes.error)
  | REExpectedType(string, string)
  | REExpressionExpected
  | REFunctionExpected(string)
  | REFunctionNotFound(string)
  | REJavaScriptExn(option<string>, option<string>) // Javascript Exception
  | REMacroNotFound(string)
  | RENotAFunction(string)
  | REOperationError(Operation.operationError)
  | RERecordPropertyNotFound(string, string)
  | RESymbolNotFound(string)
  | RESyntaxError(string, option<syntaxErrorLocation>)
  | RETodo(string) // To do
  | REUnitNotFound(string)
  | RENeedToRun
  | REOther(string)

type t = errorValue

exception ErrorException(errorValue)

let errorToString = err =>
  switch err {
  | REArityError(_oFnName, arity, usedArity) =>
    `${Js.String.make(arity)} arguments expected. Instead ${Js.String.make(
        usedArity,
      )} argument(s) were passed.`
  | REArrayIndexNotFound(msg, index) => `${msg}: ${Js.String.make(index)}`
  | REAssignmentExpected => "Assignment expected"
  | REExpressionExpected => "Expression expected"
  | REFunctionExpected(msg) => `Function expected: ${msg}`
  | REFunctionNotFound(msg) => `Function not found: ${msg}`
  | REDistributionError(err) => `Distribution Math Error: ${DistributionTypes.Error.toString(err)}`
  | REOperationError(err) => `Math Error: ${Operation.Error.toString(err)}`
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
  | RENotAFunction(valueString) => `${valueString} is not a function`
  | RERecordPropertyNotFound(msg, index) => `${msg}: ${index}`
  | RESymbolNotFound(symbolName) => `${symbolName} is not defined`
  | RESyntaxError(desc, _) => `Syntax Error: ${desc}`
  | RETodo(msg) => `TODO: ${msg}`
  | REExpectedType(typeName, valueString) => `Expected type: ${typeName} but got: ${valueString}`
  | REUnitNotFound(unitName) => `Unit not found: ${unitName}`
  | RENeedToRun => "Need to run"
  | REOther(msg) => `Error: ${msg}`
  }
