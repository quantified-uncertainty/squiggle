type environment = GenericDist.env
module T = Reducer_T

type t = Reducer_T.value

type functionCall = (string, array<t>)

let rec toString = (aValue: T.value) =>
  switch aValue {
  | IEvArray(anArray) => toStringArray(anArray)
  | IEvBool(aBool) => toStringBool(aBool)
  | IEvDate(date) => toStringDate(date)
  | IEvDeclaration(d) => toStringDeclaration(d)
  | IEvDistribution(dist) => toStringDistribution(dist)
  | IEvLambda(lambdaValue) => toStringLambda(lambdaValue)
  | IEvNumber(aNumber) => toStringNumber(aNumber)
  | IEvRecord(aMap) => aMap->toStringRecord
  | IEvString(aString) => toStringString(aString)
  | IEvTimeDuration(t) => toStringTimeDuration(t)
  | IEvVoid => toStringVoid
  }
and toStringArray = anArray => {
  let args = anArray->Js.Array2.map(each => toString(each))->Js.Array2.toString
  `[${args}]`
}
and toStringBool = aBool => Js.String.make(aBool)
and toStringCall = fName => `:${fName}`
and toStringDate = date => DateTime.Date.toString(date)
and toStringDeclaration = d => Declaration.toString(d, r => toString(IEvLambda(r)))
and toStringDistribution = dist => GenericDist.toString(dist)
and toStringLambda = (lambdaValue: T.lambdaValue) => {
  switch lambdaValue {
  | FnLambda({parameters}) => `lambda(${Js.Array2.toString(parameters)}=>internal code)`
  | FnBuiltin(_) => "Builtin function"
  }
}
and toStringNumber = aNumber => Js.String.make(aNumber)
and toStringRecord = aMap => aMap->toStringMap
and toStringString = aString => `'${aString}'`
and toStringSymbol = aString => `:${aString}`
and toStringTimeDuration = t => DateTime.Duration.toString(t)
and toStringVoid = `()`

and toStringMap = aMap => {
  let pairs =
    aMap
    ->Belt.Map.String.toArray
    ->Js.Array2.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
    ->Js.Array2.toString
  `{${pairs}}`
}

let toStringWithType = (aValue: T.value) =>
  switch aValue {
  | IEvArray(_) => `Array::${toString(aValue)}`
  | IEvBool(_) => `Bool::${toString(aValue)}`
  | IEvDate(_) => `Date::${toString(aValue)}`
  | IEvDeclaration(_) => `Declaration::${toString(aValue)}`
  | IEvDistribution(_) => `Distribution::${toString(aValue)}`
  | IEvLambda(_) => `Lambda::${toString(aValue)}`
  | IEvNumber(_) => `Number::${toString(aValue)}`
  | IEvRecord(_) => `Record::${toString(aValue)}`
  | IEvString(_) => `String::${toString(aValue)}`
  | IEvTimeDuration(_) => `Date::${toString(aValue)}`
  | IEvVoid => `Void`
  }

let argsToString = (args: array<t>): string => {
  args->Js.Array2.map(arg => arg->toString)->Js.Array2.toString
}

let toStringFunctionCall = ((fn, args)): string => `${fn}(${argsToString(args)})`

let toStringResult = x =>
  switch x {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${SqError.toString(m)})`
  }

let toStringResultOkless = (codeResult: result<t, SqError.t>): string =>
  switch codeResult {
  | Ok(a) => toString(a)
  | Error(m) => `Error(${SqError.toString(m)})`
  }

type internalExpressionValueType =
  | EvtArray
  | EvtBool
  | EvtDate
  | EvtDeclaration
  | EvtDistribution
  | EvtLambda
  | EvtNumber
  | EvtRecord
  | EvtString
  | EvtTimeDuration
  | EvtVoid

type functionCallSignature = CallSignature(string, array<internalExpressionValueType>)
type functionDefinitionSignature =
  FunctionDefinitionSignature(functionCallSignature, internalExpressionValueType)

let valueToValueType = (value: T.value) =>
  switch value {
  | IEvArray(_) => EvtArray
  | IEvBool(_) => EvtBool
  | IEvDate(_) => EvtDate
  | IEvDeclaration(_) => EvtDeclaration
  | IEvDistribution(_) => EvtDistribution
  | IEvLambda(_) => EvtLambda
  | IEvNumber(_) => EvtNumber
  | IEvRecord(_) => EvtRecord
  | IEvString(_) => EvtString
  | IEvTimeDuration(_) => EvtTimeDuration
  | IEvVoid => EvtVoid
  }

let functionCallToCallSignature = (functionCall: functionCall): functionCallSignature => {
  let (fn, args) = functionCall
  CallSignature(fn, args->Js.Array2.map(valueToValueType))
}

let valueTypeToString = (valueType: internalExpressionValueType): string =>
  switch valueType {
  | EvtArray => `Array`
  | EvtBool => `Bool`
  | EvtDate => `Date`
  | EvtDeclaration => `Declaration`
  | EvtDistribution => `Distribution`
  | EvtLambda => `Lambda`
  | EvtNumber => `Number`
  | EvtRecord => `Record`
  | EvtString => `String`
  | EvtTimeDuration => `Duration`
  | EvtVoid => `Void`
  }

let functionCallSignatureToString = (functionCallSignature: functionCallSignature): string => {
  let CallSignature(fn, args) = functionCallSignature
  `${fn}(${args->Js.Array2.map(valueTypeToString)->Js.Array2.toString})`
}

let arrayToValueArray = (arr: array<t>): array<t> => arr

let resultToValue = (rExpression: result<t, SqError.Message.t>): t =>
  switch rExpression {
  | Ok(expression) => expression
  | Error(errorValue) => SqError.Message.throw(errorValue)
  }

let recordToKeyValuePairs = (record: T.map): array<(string, t)> => record->Belt.Map.String.toArray
