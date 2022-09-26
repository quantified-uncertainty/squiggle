type location = Reducer_Peggy_Parse.location

module Message = {
  @genType.opaque
  type t =
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

  exception MessageException(t)

  let fromParseError = (
    SyntaxError(message, location): Reducer_Peggy_Parse.parseError,
  ) => RESyntaxError(message, location->Some)

  let toString = (err: t) =>
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
    | REDistributionError(err) =>
      `Distribution Math Error: ${DistributionTypes.Error.toString(err)}`
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
    | MessageException(e) => e
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

  let toException = (errorValue: t) => errorValue->MessageException->raise
}

module StackTrace = {
  @genType.opaque
  type rec t = {
    location: location,
    parent: option<t>,
  }

  let rec toString = ({location, parent}: t) => {
    `  Line ${location.start.line->Js.Int.toString}, column ${location.start.column->Js.Int.toString}, source ${location.source}\n` ++
    switch parent {
    | Some(parent) => toString(parent)
    | None => ""
    }
  }

  let rec toLocationList = (t: t): list<location> => {
    switch t.parent {
    | Some(parent) => Belt.List.add(toLocationList(parent), t.location)
    | None => list{t.location}
    }
  }

  @genType
  let toLocationArray = (t: t): array<location> => t->toLocationList->Belt.List.toArray
}

@genType.opaque
type t = {
  message: Message.t,
  stackTrace: option<StackTrace.t>,
}

exception SqException(t)

@genType
let fromMessage = (errorMessage: Message.t): t => {
  message: errorMessage,
  stackTrace: None,
}

let fromMessageWithLocation = (errorMessage: Message.t, location: location): t => {
  message: errorMessage,
  stackTrace: Some({location: location, parent: None}),
}

let extend = ({message, stackTrace}: t, location: location) => {
  message: message,
  stackTrace: Some({location: location, parent: stackTrace}),
}

@genType
let getLocation = (t: t): option<location> => t.stackTrace->E.O2.fmap(stack => stack.location)

@genType
let getStackTrace = (t: t): option<StackTrace.t> => t.stackTrace

@genType
let toString = (t: t): string => t.message->Message.toString

@genType
let createOtherError = (v: string): t => Message.REOther(v)->fromMessage

@genType
let toStringWithStackTrace = (t: t) =>
  switch t.stackTrace {
  | Some(stack) => "Traceback:\n" ++ stack->StackTrace.toString
  | None => ""
  } ++
  t->toString

let throw = (t: t) => t->SqException->raise

let fromException = exn =>
  switch exn {
  | SqException(e) => e
  | Message.MessageException(e) => e->fromMessage
  | Js.Exn.Error(obj) => REJavaScriptExn(obj->Js.Exn.message, obj->Js.Exn.name)->fromMessage
  | _ => REOther("Unknown exception")->fromMessage
  }
