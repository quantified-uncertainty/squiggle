module ErrorValue = Reducer_ErrorValue
module ExternalExpressionValue = ReducerInterface_ExpressionValue
module Extra_Array = Reducer_Extra_Array
type internalCode = ExternalExpressionValue.internalCode
type environment = ExternalExpressionValue.environment

let defaultEnvironment = ExternalExpressionValue.defaultEnvironment

type rec expressionValue =
  | IevArray(array<expressionValue>) // FIXME: Convert
  | IevArrayString(array<string>) // FIXME: Convert
  | IevBool(bool)
  | IevCall(string) // External function call
  | IevDate(Js.Date.t)
  | IevDeclaration(lambdaDeclaration)
  | IevDistribution(DistributionTypes.genericDist)
  | IevLambda(lambdaValue)
  | IevModule(nameSpace) // FIXME: Convert
  | IevNumber(float)
  | IevRecord(map)
  | IevString(string)
  | IevSymbol(string)
  | IevTimeDuration(float)
  | IevTypeIdentifier(string)
and map = Belt.Map.String.t<expressionValue>
and nameSpace = NameSpace(Belt.Map.String.t<expressionValue>)
and tmpExternalBindings = Js.Dict.t<expressionValue> // FIXME: Remove
and lambdaValue = {
  parameters: array<string>,
  context: nameSpace,
  body: internalCode,
}
and lambdaDeclaration = Declaration.declaration<lambdaValue>

type t = expressionValue

type functionCall = (string, array<expressionValue>)

let rec toString = aValue =>
  switch aValue {
  | IevArray(anArray) => {
      let args = anArray->Js.Array2.map(each => toString(each))->Js.Array2.toString
      `[${args}]`
    }
  | IevArrayString(anArray) => {
      let args = anArray->Js.Array2.toString
      `[${args}]`
    }
  | IevBool(aBool) => Js.String.make(aBool)
  | IevCall(fName) => `:${fName}`
  | IevDate(date) => DateTime.Date.toString(date)
  | IevDeclaration(d) => Declaration.toString(d, r => toString(IevLambda(r)))
  | IevDistribution(dist) => GenericDist.toString(dist)
  | IevLambda(lambdaValue) => `lambda(${Js.Array2.toString(lambdaValue.parameters)}=>internal code)`
  | IevModule(m) => `@${m->toStringNameSpace}`
  | IevNumber(aNumber) => Js.String.make(aNumber)
  | IevRecord(aMap) => aMap->toStringMap
  | IevString(aString) => `'${aString}'`
  | IevSymbol(aString) => `:${aString}`
  | IevTimeDuration(t) => DateTime.Duration.toString(t)
  | IevTypeIdentifier(id) => `#${id}`
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
  | IevArray(_) => `Array::${toString(aValue)}`
  | IevArrayString(_) => `ArrayString::${toString(aValue)}`
  | IevBool(_) => `Bool::${toString(aValue)}`
  | IevCall(_) => `Call::${toString(aValue)}`
  | IevDistribution(_) => `Distribution::${toString(aValue)}`
  | IevLambda(_) => `Lambda::${toString(aValue)}`
  | IevNumber(_) => `Number::${toString(aValue)}`
  | IevRecord(_) => `Record::${toString(aValue)}`
  | IevString(_) => `String::${toString(aValue)}`
  | IevSymbol(_) => `Symbol::${toString(aValue)}`
  | IevDate(_) => `Date::${toString(aValue)}`
  | IevTimeDuration(_) => `Date::${toString(aValue)}`
  | IevDeclaration(_) => `Declaration::${toString(aValue)}`
  | IevTypeIdentifier(_) => `TypeIdentifier::${toString(aValue)}`
  | IevModule(_) => `Module::${toString(aValue)}`
  }

let argsToString = (args: array<expressionValue>): string => {
  args->Js.Array2.map(arg => arg->toString)->Js.Array2.toString
}

let toStringFunctionCall = ((fn, args)): string => `${fn}(${argsToString(args)})`

let toStringResult = x =>
  switch x {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringResultOkless = (codeResult: result<expressionValue, ErrorValue.errorValue>): string =>
  switch codeResult {
  | Ok(a) => toString(a)
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringResultRecord = x =>
  switch x {
  | Ok(a) => `Ok(${ExternalExpressionValue.toStringRecord(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

type expressionValueType =
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

type functionCallSignature = CallSignature(string, array<expressionValueType>)
type functionDefinitionSignature =
  FunctionDefinitionSignature(functionCallSignature, expressionValueType)

let valueToValueType = value =>
  switch value {
  | IevArray(_) => EvtArray
  | IevArrayString(_) => EvtArrayString
  | IevBool(_) => EvtBool
  | IevCall(_) => EvtCall
  | IevDistribution(_) => EvtDistribution
  | IevLambda(_) => EvtLambda
  | IevNumber(_) => EvtNumber
  | IevRecord(_) => EvtRecord
  | IevString(_) => EvtString
  | IevSymbol(_) => EvtSymbol
  | IevDate(_) => EvtDate
  | IevTimeDuration(_) => EvtTimeDuration
  | IevDeclaration(_) => EvtDeclaration
  | IevTypeIdentifier(_) => EvtTypeIdentifier
  | IevModule(_) => EvtModule
  }

let functionCallToCallSignature = (functionCall: functionCall): functionCallSignature => {
  let (fn, args) = functionCall
  CallSignature(fn, args->Js.Array2.map(valueToValueType))
}

let valueTypeToString = (valueType: expressionValueType): string =>
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

let rec toExternal = (iev: expressionValue): ExternalExpressionValue.expressionValue => {
  switch iev {
  | IevArray(v) => v->Belt.Array.map(e => toExternal(e))->EvArray
  | IevArrayString(v) => EvArrayString(v)
  | IevBool(v) => EvBool(v)
  | IevCall(v) => EvCall(v)
  | IevDistribution(v) => EvDistribution(v)
  | IevLambda(v) => EvLambda(lambdaValueToExternal(v))
  | IevNumber(v) => EvNumber(v)
  | IevRecord(v) => v->mapToExternal->EvRecord
  | IevString(v) => EvString(v)
  | IevSymbol(v) => EvSymbol(v)
  | IevDate(v) => EvDate(v)
  | IevTimeDuration(v) => EvTimeDuration(v)
  | IevDeclaration(v) => {
      let fn = lambdaValueToExternal(v.fn)
      let args = v.args
      EvDeclaration({fn: fn, args: args})
    }
  | IevTypeIdentifier(v) => EvTypeIdentifier(v)
  | IevModule(v) => v->nameSpaceToTypeScriptBindings->EvModule
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
): ReducerInterface_ExpressionValue.externalBindings => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.map(container, e => toExternal(e))->Belt.Map.String.toArray->Js.Dict.fromArray
}

let rec toInternal = (ev: ExternalExpressionValue.expressionValue): expressionValue => {
  switch ev {
  | EvArray(v) => v->Belt.Array.map(e => toInternal(e))->IevArray
  | EvArrayString(v) => IevArrayString(v)
  | EvBool(v) => IevBool(v)
  | EvCall(v) => IevCall(v)
  | EvDistribution(v) => IevDistribution(v)
  | EvLambda(v) => IevLambda(lambdaValueToInternal(v))
  | EvNumber(v) => IevNumber(v)
  | EvRecord(v) => v->recordToInternal->IevRecord
  | EvString(v) => IevString(v)
  | EvSymbol(v) => IevSymbol(v)
  | EvDate(v) => IevDate(v)
  | EvTimeDuration(v) => IevTimeDuration(v)
  | EvDeclaration(v) => {
      let fn = lambdaValueToInternal(v.fn)
      let args = v.args
      IevDeclaration({fn: fn, args: args})
    }
  | EvTypeIdentifier(v) => IevTypeIdentifier(v)
  | EvModule(v) => v->nameSpaceFromTypeScriptBindings->IevModule
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
  r: ReducerInterface_ExpressionValue.externalBindings,
): nameSpace =>
  r->Js.Dict.entries->Belt.Map.String.fromArray->Belt.Map.String.map(e => toInternal(e))->NameSpace
