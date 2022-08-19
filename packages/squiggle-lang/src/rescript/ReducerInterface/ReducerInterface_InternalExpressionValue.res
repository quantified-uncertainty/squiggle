module ErrorValue = Reducer_ErrorValue
module Extra_Array = Reducer_Extra_Array
type internalCode = Object
type environment = GenericDist.env

let defaultEnvironment: environment = DistributionOperation.defaultEnv

type rec t =
  | IEvArray(array<t>) // FIXME: Convert to MapInt
  | IEvArrayString(array<string>)
  | IEvBool(bool)
  | IEvCall(string) // External function call
  | IEvDate(Js.Date.t)
  | IEvDeclaration(lambdaDeclaration)
  | IEvDistribution(DistributionTypes.genericDist)
  | IEvLambda(lambdaValue)
  | IEvBindings(nameSpace)
  | IEvNumber(float)
  | IEvRecord(map)
  | IEvString(string)
  | IEvSymbol(string)
  | IEvTimeDuration(float)
  | IEvType(map)
  | IEvTypeIdentifier(string)
  | IEvVoid
and squiggleArray = array<t>
and map = Belt.Map.String.t<t>
and nameSpace = NameSpace(Belt.Map.String.t<t>)
and lambdaValue = {
  parameters: array<string>,
  context: nameSpace,
  body: internalCode,
}
and lambdaDeclaration = Declaration.declaration<lambdaValue>

type squiggleMap = map
type internalExpressionValue = t

type functionCall = (string, array<t>)

let rec toString = aValue =>
  switch aValue {
  | IEvArray(anArray) => {
      let args = anArray->Js.Array2.map(each => toString(each))->Js.Array2.toString
      `[${args}]`
    }
  | IEvArrayString(anArray) => {
      let args = anArray->Js.Array2.toString
      `[${args}]`
    }
  | IEvBool(aBool) => Js.String.make(aBool)
  | IEvCall(fName) => `:${fName}`
  | IEvDate(date) => DateTime.Date.toString(date)
  | IEvDeclaration(d) => Declaration.toString(d, r => toString(IEvLambda(r)))
  | IEvDistribution(dist) => GenericDist.toString(dist)
  | IEvLambda(lambdaValue) => `lambda(${Js.Array2.toString(lambdaValue.parameters)}=>internal code)`
  | IEvBindings(m) => `@${m->toStringNameSpace}`
  | IEvNumber(aNumber) => Js.String.make(aNumber)
  | IEvRecord(aMap) => aMap->toStringMap
  | IEvString(aString) => `'${aString}'`
  | IEvSymbol(aString) => `:${aString}`
  | IEvType(aMap) => aMap->toStringMap
  | IEvTimeDuration(t) => DateTime.Duration.toString(t)
  | IEvTypeIdentifier(id) => `#${id}`
  | IEvVoid => `()`
  }
and toStringMap = aMap => {
  let pairs =
    aMap
    ->Belt.Map.String.toArray
    ->Js.Array2.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
    ->Js.Array2.toString
  `{${pairs}}`
}
and toStringNameSpace = nameSpace => {
  let NameSpace(container) = nameSpace
  container->toStringMap
}

let toStringWithType = aValue =>
  switch aValue {
  | IEvArray(_) => `Array::${toString(aValue)}`
  | IEvArrayString(_) => `ArrayString::${toString(aValue)}`
  | IEvBool(_) => `Bool::${toString(aValue)}`
  | IEvCall(_) => `Call::${toString(aValue)}`
  | IEvDate(_) => `Date::${toString(aValue)}`
  | IEvDeclaration(_) => `Declaration::${toString(aValue)}`
  | IEvDistribution(_) => `Distribution::${toString(aValue)}`
  | IEvLambda(_) => `Lambda::${toString(aValue)}`
  | IEvBindings(_) => `Bindings::${toString(aValue)}`
  | IEvNumber(_) => `Number::${toString(aValue)}`
  | IEvRecord(_) => `Record::${toString(aValue)}`
  | IEvString(_) => `String::${toString(aValue)}`
  | IEvSymbol(_) => `Symbol::${toString(aValue)}`
  | IEvTimeDuration(_) => `Date::${toString(aValue)}`
  | IEvType(_) => `Type::${toString(aValue)}`
  | IEvTypeIdentifier(_) => `TypeIdentifier::${toString(aValue)}`
  | IEvVoid => `Void`
  }

let argsToString = (args: array<t>): string => {
  args->Js.Array2.map(arg => arg->toString)->Js.Array2.toString
}

let toStringFunctionCall = ((fn, args)): string => `${fn}(${argsToString(args)})`

let toStringResult = x =>
  switch x {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringOptionResult = x =>
  switch x {
  | Some(a) => toStringResult(a)
  | None => "None"
  }

let toStringResultOkless = (codeResult: result<t, ErrorValue.errorValue>): string =>
  switch codeResult {
  | Ok(a) => toString(a)
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringResultRecord = x =>
  switch x {
  | Ok(a) => `Ok(${toStringMap(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

type internalExpressionValueType =
  | EvtArray
  | EvtArrayString
  | EvtBool
  | EvtCall
  | EvtDate
  | EvtDeclaration
  | EvtDistribution
  | EvtLambda
  | EvtModule
  | EvtNumber
  | EvtRecord
  | EvtString
  | EvtSymbol
  | EvtTimeDuration
  | EvtType
  | EvtTypeIdentifier
  | EvtVoid

type functionCallSignature = CallSignature(string, array<internalExpressionValueType>)
type functionDefinitionSignature =
  FunctionDefinitionSignature(functionCallSignature, internalExpressionValueType)

let valueToValueType = value =>
  switch value {
  | IEvArray(_) => EvtArray
  | IEvArrayString(_) => EvtArrayString
  | IEvBool(_) => EvtBool
  | IEvCall(_) => EvtCall
  | IEvDate(_) => EvtDate
  | IEvDeclaration(_) => EvtDeclaration
  | IEvDistribution(_) => EvtDistribution
  | IEvLambda(_) => EvtLambda
  | IEvBindings(_) => EvtModule
  | IEvNumber(_) => EvtNumber
  | IEvRecord(_) => EvtRecord
  | IEvString(_) => EvtString
  | IEvSymbol(_) => EvtSymbol
  | IEvTimeDuration(_) => EvtTimeDuration
  | IEvType(_) => EvtType
  | IEvTypeIdentifier(_) => EvtTypeIdentifier
  | IEvVoid => EvtVoid
  }

let functionCallToCallSignature = (functionCall: functionCall): functionCallSignature => {
  let (fn, args) = functionCall
  CallSignature(fn, args->Js.Array2.map(valueToValueType))
}

let valueTypeToString = (valueType: internalExpressionValueType): string =>
  switch valueType {
  | EvtArray => `Array`
  | EvtArrayString => `ArrayString`
  | EvtBool => `Bool`
  | EvtCall => `Call`
  | EvtDate => `Date`
  | EvtDeclaration => `Declaration`
  | EvtDistribution => `Distribution`
  | EvtLambda => `Lambda`
  | EvtModule => `Module`
  | EvtNumber => `Number`
  | EvtRecord => `Record`
  | EvtString => `String`
  | EvtSymbol => `Symbol`
  | EvtTimeDuration => `Duration`
  | EvtType => `Type`
  | EvtTypeIdentifier => `TypeIdentifier`
  | EvtVoid => `Void`
  }

let functionCallSignatureToString = (functionCallSignature: functionCallSignature): string => {
  let CallSignature(fn, args) = functionCallSignature
  `${fn}(${args->Js.Array2.map(valueTypeToString)->Js.Array2.toString})`
}

let arrayToValueArray = (arr: array<t>): array<t> => arr

let recordToKeyValuePairs = (record: map): array<(string, t)> => record->Belt.Map.String.toArray

// let nameSpaceToTypeScriptBindings = (
//   nameSpace: nameSpace,
// ) => {
//   let NameSpace(container) = nameSpace
//   Belt.Map.String.map(container, e => e->Belt.Map.String.toArray->Js.Dict.fromArray)
// }

let nameSpaceToKeyValuePairs = (nameSpace: nameSpace): array<(string, t)> => {
  let NameSpace(container) = nameSpace
  container->Belt.Map.String.toArray
}
