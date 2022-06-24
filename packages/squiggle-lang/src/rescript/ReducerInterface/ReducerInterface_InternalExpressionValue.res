module ErrorValue = Reducer_ErrorValue
module ExternalExpressionValue = ReducerInterface_ExternalExpressionValue
module Extra_Array = Reducer_Extra_Array
type internalCode = ExternalExpressionValue.internalCode
type environment = ExternalExpressionValue.environment

let defaultEnvironment = ExternalExpressionValue.defaultEnvironment

type rec t =
  | IEvArray(array<t>) // FIXME: Convert
  | IEvArrayString(array<string>) // FIXME: Convert
  | IEvBool(bool)
  | IEvCall(string) // External function call
  | IEvDate(Js.Date.t)
  | IEvDeclaration(lambdaDeclaration)
  | IEvDistribution(DistributionTypes.genericDist)
  | IEvLambda(lambdaValue)
  | IEvModule(nameSpace)
  | IEvNumber(float)
  | IEvRecord(map)
  | IEvString(string)
  | IEvSymbol(string)
  | IEvTimeDuration(float)
  | IEvTypeIdentifier(string)
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
  | IEvModule(m) => `@${m->toStringNameSpace}`
  | IEvNumber(aNumber) => Js.String.make(aNumber)
  | IEvRecord(aMap) => aMap->toStringMap
  | IEvString(aString) => `'${aString}'`
  | IEvSymbol(aString) => `:${aString}`
  | IEvTimeDuration(t) => DateTime.Duration.toString(t)
  | IEvTypeIdentifier(id) => `#${id}`
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
  | IEvDistribution(_) => `Distribution::${toString(aValue)}`
  | IEvLambda(_) => `Lambda::${toString(aValue)}`
  | IEvNumber(_) => `Number::${toString(aValue)}`
  | IEvRecord(_) => `Record::${toString(aValue)}`
  | IEvString(_) => `String::${toString(aValue)}`
  | IEvSymbol(_) => `Symbol::${toString(aValue)}`
  | IEvDate(_) => `Date::${toString(aValue)}`
  | IEvTimeDuration(_) => `Date::${toString(aValue)}`
  | IEvDeclaration(_) => `Declaration::${toString(aValue)}`
  | IEvTypeIdentifier(_) => `TypeIdentifier::${toString(aValue)}`
  | IEvModule(_) => `Module::${toString(aValue)}`
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
  | EvtDistribution
  | EvtLambda
  | EvtNumber
  | EvtRecord
  | EvtString
  | EvtSymbol
  | EvtDate
  | EvtTimeDuration
  | EvtDeclaration
  | EvtTypeIdentifier
  | EvtModule

type functionCallSignature = CallSignature(string, array<internalExpressionValueType>)
type functionDefinitionSignature =
  FunctionDefinitionSignature(functionCallSignature, internalExpressionValueType)

let valueToValueType = value =>
  switch value {
  | IEvArray(_) => EvtArray
  | IEvArrayString(_) => EvtArrayString
  | IEvBool(_) => EvtBool
  | IEvCall(_) => EvtCall
  | IEvDistribution(_) => EvtDistribution
  | IEvLambda(_) => EvtLambda
  | IEvNumber(_) => EvtNumber
  | IEvRecord(_) => EvtRecord
  | IEvString(_) => EvtString
  | IEvSymbol(_) => EvtSymbol
  | IEvDate(_) => EvtDate
  | IEvTimeDuration(_) => EvtTimeDuration
  | IEvDeclaration(_) => EvtDeclaration
  | IEvTypeIdentifier(_) => EvtTypeIdentifier
  | IEvModule(_) => EvtModule
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
  | EvtDistribution => `Distribution`
  | EvtLambda => `Lambda`
  | EvtNumber => `Number`
  | EvtRecord => `Record`
  | EvtString => `String`
  | EvtSymbol => `Symbol`
  | EvtDate => `Date`
  | EvtTimeDuration => `Duration`
  | EvtDeclaration => `Declaration`
  | EvtTypeIdentifier => `TypeIdentifier`
  | EvtModule => `Module`
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
  | IEvDistribution(v) => EvDistribution(v)
  | IEvLambda(v) => EvLambda(lambdaValueToExternal(v))
  | IEvNumber(v) => EvNumber(v)
  | IEvRecord(v) => v->mapToExternal->EvRecord
  | IEvString(v) => EvString(v)
  | IEvSymbol(v) => EvSymbol(v)
  | IEvDate(v) => EvDate(v)
  | IEvTimeDuration(v) => EvTimeDuration(v)
  | IEvDeclaration(v) => {
      let fn = lambdaValueToExternal(v.fn)
      let args = v.args
      EvDeclaration({fn: fn, args: args})
    }
  | IEvTypeIdentifier(v) => EvTypeIdentifier(v)
  | IEvModule(v) => v->nameSpaceToTypeScriptBindings->EvModule
  }
}
and mapToExternal = v =>
  v->Belt.Map.String.map(e => toExternal(e))->Belt.Map.String.toArray->Js.Dict.fromArray
and lambdaValueToExternal = v => {
  let p = v.parameters
  let c = v.context->nameSpaceToTypeScriptBindings
  let b = v.body
  {parameters: p, context: c, body: b}
}
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
  | EvDistribution(v) => IEvDistribution(v)
  | EvLambda(v) => IEvLambda(lambdaValueToInternal(v))
  | EvNumber(v) => IEvNumber(v)
  | EvRecord(v) => v->recordToInternal->IEvRecord
  | EvString(v) => IEvString(v)
  | EvSymbol(v) => IEvSymbol(v)
  | EvDate(v) => IEvDate(v)
  | EvTimeDuration(v) => IEvTimeDuration(v)
  | EvDeclaration(v) => {
      let fn = lambdaValueToInternal(v.fn)
      let args = v.args
      IEvDeclaration({fn: fn, args: args})
    }
  | EvTypeIdentifier(v) => IEvTypeIdentifier(v)
  | EvModule(v) => v->nameSpaceFromTypeScriptBindings->IEvModule
  }
}
and recordToInternal = v =>
  v->Js.Dict.entries->Belt.Map.String.fromArray->Belt.Map.String.map(e => toInternal(e))
and lambdaValueToInternal = v => {
  let p = v.parameters
  let c = v.context->nameSpaceFromTypeScriptBindings
  let b = v.body
  {parameters: p, context: c, body: b}
}
and nameSpaceFromTypeScriptBindings = (
  r: ReducerInterface_ExternalExpressionValue.externalBindings,
): nameSpace =>
  r->Js.Dict.entries->Belt.Map.String.fromArray->Belt.Map.String.map(e => toInternal(e))->NameSpace
