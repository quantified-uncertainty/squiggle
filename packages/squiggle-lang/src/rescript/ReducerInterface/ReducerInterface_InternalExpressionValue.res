module ErrorValue = Reducer_ErrorValue
module ExternalExpressionValue = ReducerInterface_ExternalExpressionValue
module Extra_Array = Reducer_Extra_Array
type internalCode = ExternalExpressionValue.internalCode
type environment = ExternalExpressionValue.environment

let defaultEnvironment = ExternalExpressionValue.defaultEnvironment

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
and map = Belt.Map.String.t<t>
and nameSpace = NameSpace(Belt.Map.String.t<t>)
and lambdaValue = {
  parameters: array<string>,
  context: nameSpace,
  body: internalCode,
}
and lambdaDeclaration = Declaration.declaration<lambdaValue>

type internalExpressionValue = t

type functionCall = (string, array<t>)

module Internal = {
  module NameSpace = {
    external castNameSpaceToHidden: nameSpace => ExternalExpressionValue.hiddenNameSpace =
      "%identity"
    external castHiddenToNameSpace: ExternalExpressionValue.hiddenNameSpace => nameSpace =
      "%identity"
  }
  module Lambda = {
    let toInternal = (v: ExternalExpressionValue.lambdaValue): lambdaValue => {
      let p = v.parameters
      let c = v.context->NameSpace.castHiddenToNameSpace
      let b = v.body
      {parameters: p, context: c, body: b}
    }
    and toExternal = (v: lambdaValue): ExternalExpressionValue.lambdaValue => {
      let p = v.parameters
      let c = v.context->NameSpace.castNameSpaceToHidden
      let b = v.body
      {parameters: p, context: c, body: b}
    }
  }
}

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

let toStringResultOkless = (codeResult: result<t, ErrorValue.errorValue>): string =>
  switch codeResult {
  | Ok(a) => toString(a)
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringResultRecord = x =>
  switch x {
  | Ok(a) => `Ok(${ExternalExpressionValue.toStringRecord(a)})`
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

let externalValueToValueType = (value: ExternalExpressionValue.t) =>
  switch value {
  | EvArray(_) => EvtArray
  | EvArrayString(_) => EvtArrayString
  | EvBool(_) => EvtBool
  | EvCall(_) => EvtCall
  | EvDate(_) => EvtDate
  | EvDeclaration(_) => EvtDeclaration
  | EvDistribution(_) => EvtDistribution
  | EvLambda(_) => EvtLambda
  | EvModule(_) => EvtModule
  | EvNumber(_) => EvtNumber
  | EvRecord(_) => EvtRecord
  | EvString(_) => EvtString
  | EvSymbol(_) => EvtSymbol
  | EvTimeDuration(_) => EvtTimeDuration
  | EvType(_) => EvtType
  | EvTypeIdentifier(_) => EvtTypeIdentifier
  | EvVoid => EvtVoid
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

let rec toExternal = (iev: t): ExternalExpressionValue.t => {
  switch iev {
  | IEvArray(v) => v->Belt.Array.map(e => toExternal(e))->EvArray
  | IEvArrayString(v) => EvArrayString(v)
  | IEvBool(v) => EvBool(v)
  | IEvCall(v) => EvCall(v)
  | IEvDeclaration(v) => {
      let fn = lambdaValueToExternal(v.fn)
      let args = v.args
      EvDeclaration({fn: fn, args: args})
    }
  | IEvDistribution(v) => EvDistribution(v)
  | IEvLambda(v) => EvLambda(lambdaValueToExternal(v))
  | IEvNumber(v) => EvNumber(v)
  | IEvRecord(v) => v->mapToExternal->EvRecord
  | IEvString(v) => EvString(v)
  | IEvSymbol(v) => EvSymbol(v)
  | IEvDate(v) => EvDate(v)
  | IEvTimeDuration(v) => EvTimeDuration(v)
  | IEvType(v) => v->mapToExternal->EvType
  | IEvTypeIdentifier(v) => EvTypeIdentifier(v)
  | IEvBindings(v) => v->nameSpaceToTypeScriptBindings->EvModule
  | IEvVoid => EvVoid
  }
}
and mapToExternal = v =>
  v->Belt.Map.String.map(e => toExternal(e))->Belt.Map.String.toArray->Js.Dict.fromArray
and lambdaValueToExternal = Internal.Lambda.toExternal
and nameSpaceToTypeScriptBindings = (
  nameSpace: nameSpace,
): ReducerInterface_ExternalExpressionValue.externalBindings => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.map(container, e => toExternal(e))->Belt.Map.String.toArray->Js.Dict.fromArray
}

let rec toInternal = (ev: ExternalExpressionValue.t): t => {
  switch ev {
  | EvArray(v) => v->Belt.Array.map(e => toInternal(e))->IEvArray
  | EvArrayString(v) => IEvArrayString(v)
  | EvBool(v) => IEvBool(v)
  | EvCall(v) => IEvCall(v)
  | EvDate(v) => IEvDate(v)
  | EvDeclaration(v) => {
      let fn = lambdaValueToInternal(v.fn)
      let args = v.args
      IEvDeclaration({fn: fn, args: args})
    }
  | EvDistribution(v) => IEvDistribution(v)
  | EvLambda(v) => IEvLambda(lambdaValueToInternal(v))
  | EvModule(v) => v->nameSpaceFromTypeScriptBindings->IEvBindings
  | EvNumber(v) => IEvNumber(v)
  | EvRecord(v) => v->recordToInternal->IEvRecord
  | EvString(v) => IEvString(v)
  | EvSymbol(v) => IEvSymbol(v)
  | EvTimeDuration(v) => IEvTimeDuration(v)
  | EvType(v) => v->recordToInternal->IEvType
  | EvTypeIdentifier(v) => IEvTypeIdentifier(v)
  | EvVoid => IEvVoid
  }
}
and recordToInternal = v =>
  v->Js.Dict.entries->Belt.Map.String.fromArray->Belt.Map.String.map(e => toInternal(e))
and lambdaValueToInternal = Internal.Lambda.toInternal
and nameSpaceFromTypeScriptBindings = (
  r: ReducerInterface_ExternalExpressionValue.externalBindings,
): nameSpace =>
  r->Js.Dict.entries->Belt.Map.String.fromArray->Belt.Map.String.map(e => toInternal(e))->NameSpace
