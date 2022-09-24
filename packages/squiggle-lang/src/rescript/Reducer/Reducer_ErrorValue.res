// Do not gentype this, use LocationRange from peggy types instead
// TODO - rename locationPoint -> location, location -> locationRange to match peggy
@genType
type locationPoint = {
  line: int,
  column: int,
}
@genType
type location = {
  source: string,
  start: locationPoint,
  end: locationPoint,
}

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
  | RESyntaxError(string, option<location>)
  | RETodo(string) // To do
  | REUnitNotFound(string)
  | RENeedToRun
  | REOther(string)

type t = errorValue

exception ErrorException(errorValue)

type rec stackTrace = {
  location: location,
  parent: option<stackTrace>,
}

@genType.opaque
type error = {
  error: t,
  stackTrace: option<stackTrace>,
}

exception ExceptionWithStackTrace(error)

let errorValueToString = (err: errorValue) =>
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

let fromException = exn =>
  switch exn {
  | ErrorException(e) => e
  | Js.Exn.Error(e) =>
    switch Js.Exn.message(e) {
    | Some(message) => REOther(message)
    | None =>
      switch Js.Exn.name(e) {
      | Some(name) => REOther(name)
      | None => REOther("Unknown error")
      }
    }
  | _e => REOther("Unknown error")
  }

let rec stackTraceToString = ({location, parent}: stackTrace) => {
  `  Line ${location.start.line->Js.Int.toString}, column ${location.start.column->Js.Int.toString}, source ${location.source}\n` ++
  switch parent {
  | Some(parent) => stackTraceToString(parent)
  | None => ""
  }
}

let errorToString = (err: error) =>
  switch err.stackTrace {
  | Some(stack) => "Traceback:\n" ++ stack->stackTraceToString
  | None => ""
  } ++
  err.error->errorValueToString

let toException = (errorValue: t) => errorValue->ErrorException->raise

let attachEmptyStackTraceToErrorValue = (errorValue: t) => {
  error: errorValue,
  stackTrace: None,
}

let attachLocationToErrorValue = (errorValue: t, location: location): error => {
  error: errorValue,
  stackTrace: Some({location: location, parent: None}),
}

let raiseNewExceptionWithStackTrace = (errorValue: t, location: location) =>
  errorValue->attachLocationToErrorValue(location)->ExceptionWithStackTrace->raise

let raiseExtendedExceptionWithStackTrace = ({error, stackTrace}: error, location: location) =>
  {error: error, stackTrace: Some({location: location, parent: stackTrace})}
  ->ExceptionWithStackTrace
  ->raise
