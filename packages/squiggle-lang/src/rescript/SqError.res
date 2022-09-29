type location = Reducer_Peggy_Parse.location

// Messages don't contain any stack trace information.
// FunctionRegistry functions are allowed to throw MessageExceptions, though, because they will be caught and rewrapped by Reducer_Lambda code
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

  let throw = (errorValue: t) => errorValue->MessageException->raise
}

@genType.opaque
type t = {
  message: Message.t,
  /*
  Errors raised from internal functions can have empty location.

  Also, location is not the same as the top of the stackTrace.
  Consider this:
  ```
  f() = {
    x = 5
    y = z // no such var
    x + y
  }
  ```
  This code should report the location of assignment issue, but there's no function call there.
 */
  location: option<location>,
  stackTrace: Reducer_CallStack.t,
}

exception SqException(t)

// `context` should be specified for runtime errors, but can be left empty for errors from Reducer_Project and so on.
// `location` can be empty for errors raised from FunctionRegistry.
let fromMessage = (
  message: Message.t,
  context: option<Reducer_T.context>,
  location: option<location>,
): t => {
  message: message,
  location: location,
  stackTrace: switch context {
  | Some(context) => context.callStack
  | None => Reducer_CallStack.make()
  },
}

@genType
let getTopFrame = (t: t): option<Reducer_CallStack.frame> =>
  t.stackTrace->Reducer_CallStack.getTopFrame

@genType
let getStackTrace = (t: t): Reducer_CallStack.t => t.stackTrace

@genType
let toString = (t: t): string => t.message->Message.toString

@genType
let createOtherError = (v: string): t => Message.REOther(v)->fromMessage()

@genType
let getFrameArray = (t: t): array<Reducer_CallStack.frame> =>
  t.stackTrace->Reducer_CallStack.toFrameArray

@genType
let toStringWithStackTrace = (t: t) =>
  if t.stackTrace->Reducer_CallStack.isEmpty {
    "Traceback:\n" ++ t.stackTrace->Reducer_CallStack.toString
  } else {
    ""
  } ++
  t->toString

let throw = (t: t) => t->SqException->raise

let throwMessage = (message: Message.t, context: Reducer_T.context, location: location) =>
  fromMessage(message, context, location)->throw

// this shouldn't be used for most runtime errors - the resulting error would have an empty stacktrace
let fromException = exn =>
  switch exn {
  | SqException(e) => e
  | Message.MessageException(e) => e->fromMessage
  | Js.Exn.Error(obj) => REJavaScriptExn(obj->Js.Exn.message, obj->Js.Exn.name)->fromMessage
  | _ => REOther("Unknown exception")->fromMessage
  }

// converts raw exceptions into exceptions with stacktrace attached
// already converted exceptions won't be affected
let contextualizeAndRethrow = (fn: unit => 'a, context: Reducer_T.context) => {
  try {
    fn()
  } catch {
  | SqException(e) => e->throw
  | Message.MessageException(e) => e->throwMessage(context)
  | Js.Exn.Error(obj) =>
    REJavaScriptExn(obj->Js.Exn.message, obj->Js.Exn.name)->throwMessage(context)
  | _ => REOther("Unknown exception")->throwMessage(context)
  }
}
