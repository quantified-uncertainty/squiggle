/*
  Irreducible values. Reducer does not know about those. Only used for external calls
  This is a configuration to to make external calls of those types
*/
module Extra_Array = Reducer_Extra_Array
module ErrorValue = Reducer_ErrorValue

@genType.opaque
type internalCode = Object

@genType
type rec expressionValue =
  | EvArray(array<expressionValue>)
  | EvArrayString(array<string>)
  | EvBool(bool)
  | EvCall(string) // External function call
  | EvDistribution(DistributionTypes.genericDist)
  | EvLambda((array<string>, record, internalCode))
  | EvNumber(float)
  | EvRecord(record)
  | EvString(string)
  | EvSymbol(string)
and record = Js.Dict.t<expressionValue>

@genType
type externalBindings = record
@genType
let defaultExternalBindings: externalBindings = Js.Dict.empty()

type functionCall = (string, array<expressionValue>)

let rec toString = aValue =>
  switch aValue {
  | EvArray(anArray) => {
      let args = anArray->Js.Array2.map(each => toString(each))->Js.Array2.toString
      `[${args}]`
    }
  | EvArrayString(anArray) => {
      let args = anArray->Js.Array2.toString
      `[${args}]`
    }
  | EvBool(aBool) => Js.String.make(aBool)
  | EvCall(fName) => `:${fName}`
  | EvLambda((parameters, _context, _internalCode)) =>
    `lambda(${Js.Array2.toString(parameters)}=>internal)`
  | EvNumber(aNumber) => Js.String.make(aNumber)
  | EvString(aString) => `'${aString}'`
  | EvSymbol(aString) => `:${aString}`
  | EvRecord(aRecord) => aRecord->toStringRecord
  | EvDistribution(dist) => GenericDist.toString(dist)
  }
and toStringRecord = aRecord => {
  let pairs =
    aRecord
    ->Js.Dict.entries
    ->Js.Array2.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
    ->Js.Array2.toString
  `{${pairs}}`
}

let toStringWithType = aValue =>
  switch aValue {
  | EvArray(_) => `Array::${toString(aValue)}`
  | EvArrayString(_) => `ArrayString::${toString(aValue)}`
  | EvBool(_) => `Bool::${toString(aValue)}`
  | EvCall(_) => `Call::${toString(aValue)}`
  | EvDistribution(_) => `Distribution::${toString(aValue)}`
  | EvLambda((_parameters, _context, _internalCode)) => `Lambda::${toString(aValue)}`
  | EvNumber(_) => `Number::${toString(aValue)}`
  | EvRecord(_) => `Record::${toString(aValue)}`
  | EvString(_) => `String::${toString(aValue)}`
  | EvSymbol(_) => `Symbol::${toString(aValue)}`
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

let toStringResultRecord = x =>
  switch x {
  | Ok(a) => `Ok(${toStringRecord(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

@genType
type environment = DistributionOperation.env

@genType
let defaultEnvironment: environment = DistributionOperation.defaultEnv
