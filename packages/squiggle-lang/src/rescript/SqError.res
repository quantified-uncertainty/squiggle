type location = Reducer_Peggy_Parse.location

// Messages don't contain any stack trace information.
// FunctionRegistry functions are allowed to throw MessageExceptions, though,
// because they will be caught and rewrapped by Reducer_Lambda code.
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
    | RESyntaxError(string)
    | RETodo(string) // To do
    | REUnitNotFound(string)
    | RENeedToRun
    | REOther(string)

  exception MessageException(t)

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
    | RESyntaxError(desc) => `Syntax Error: ${desc}`
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
  frameStack: Reducer_FrameStack.t,
}

exception SqException(t)

let fromMessageWithFrameStack = (message: Message.t, frameStack: Reducer_FrameStack.t): t => {
  message,
  frameStack,
}

// this shouldn't be used much, since frame stack will be empty
// but it's useful for global errors, e.g. in ReducerProject or somethere in the frontend
@genType
let fromMessage = (message: Message.t) =>
  fromMessageWithFrameStack(message, Reducer_FrameStack.make())

let fromParseError = (SyntaxError(message, location): Reducer_Peggy_Parse.parseError) =>
  RESyntaxError(message)->fromMessageWithFrameStack(
    Reducer_FrameStack.makeSingleFrameStack(location),
  )

@genType
let getTopFrame = (t: t): option<Reducer_T.frame> => t.frameStack->Reducer_FrameStack.getTopFrame

@genType
let getFrameStack = (t: t): Reducer_FrameStack.t => t.frameStack

@genType
let toString = (t: t): string => t.message->Message.toString

@genType
let createOtherError = (v: string): t => Message.REOther(v)->fromMessage

@genType
let getFrameArray = (t: t): array<Reducer_T.frame> => t.frameStack->Reducer_FrameStack.toFrameArray

@genType
let toStringWithStackTrace = (t: t) =>
  t->toString ++ if t.frameStack->Reducer_FrameStack.isEmpty {
      "\nStack trace:\n" ++ t.frameStack->Reducer_FrameStack.toString
    } else {
      ""
    }
let throw = (t: t) => t->SqException->raise

let throwMessageWithFrameStack = (message: Message.t, frameStack: Reducer_FrameStack.t) =>
  message->fromMessageWithFrameStack(frameStack)->throw

// this shouldn't be used for most runtime errors - the resulting error would have an empty framestack
let fromException = exn =>
  switch exn {
  | SqException(e) => e
  | Message.MessageException(e) => e->fromMessage
  | Js.Exn.Error(obj) => REJavaScriptExn(obj->Js.Exn.message, obj->Js.Exn.name)->fromMessage
  | _ => REOther("Unknown exception")->fromMessage
  }

// converts raw exceptions into exceptions with framestack attached
// already converted exceptions won't be affected
let rethrowWithFrameStack = (fn: unit => 'a, frameStack: Reducer_FrameStack.t) => {
  try {
    fn()
  } catch {
  | SqException(e) => e->throw // exception already has a framestack
  | Message.MessageException(e) => e->throwMessageWithFrameStack(frameStack) // probably comes from FunctionRegistry, adding framestack
  | Js.Exn.Error(obj) =>
    REJavaScriptExn(obj->Js.Exn.message, obj->Js.Exn.name)->throwMessageWithFrameStack(frameStack)
  | _ => REOther("Unknown exception")->throwMessageWithFrameStack(frameStack)
  }
}
