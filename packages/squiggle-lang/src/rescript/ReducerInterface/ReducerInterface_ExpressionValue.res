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
  | EvBool(bool)
  | EvCall(string) // External function call
  | EvDistribution(DistributionTypes.genericDist)
  | EvLambda((array<string>, internalCode))
  | EvNumber(float)
  | EvRecord(Js.Dict.t<expressionValue>)
  | EvString(string)
  | EvSymbol(string)

@genType
type externalBindings = Js.Dict.t<expressionValue>
@genType
let defaultExternalBindings: externalBindings = Js.Dict.empty()

type functionCall = (string, array<expressionValue>)

let rec toString = aValue =>
  switch aValue {
  | EvBool(aBool) => Js.String.make(aBool)
  | EvCall(fName) => `:${fName}`
  | EvLambda((parameters, _internalCode)) => `lambda(${Js.Array2.toString(parameters)}=>internal)`
  | EvNumber(aNumber) => Js.String.make(aNumber)
  | EvString(aString) => `'${aString}'`
  | EvSymbol(aString) => `:${aString}`
  | EvArray(anArray) => {
      let args =
        anArray
        ->Belt.Array.map(each => toString(each))
        ->Extra_Array.interperse(", ")
        ->Js.String.concatMany("")
      `[${args}]`
    }
  | EvRecord(aRecord) => aRecord->toStringRecord
  | EvDistribution(dist) => GenericDist.toString(dist)
  }
and toStringRecord = aRecord => {
  let pairs =
    aRecord
    ->Js.Dict.entries
    ->Belt.Array.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
    ->Extra_Array.interperse(", ")
    ->Js.String.concatMany("")
  `{${pairs}}`
}

let toStringWithType = aValue =>
  switch aValue {
  | EvArray(_) => `Array::${toString(aValue)}`
  | EvBool(_) => `Bool::${toString(aValue)}`
  | EvCall(_) => `Call::${toString(aValue)}`
  | EvDistribution(_) => `Distribution::${toString(aValue)}`
  | EvLambda((_parameters, _internalCode)) => `Lambda::${toString(aValue)}`
  | EvNumber(_) => `Number::${toString(aValue)}`
  | EvRecord(_) => `Record::${toString(aValue)}`
  | EvString(_) => `String::${toString(aValue)}`
  | EvSymbol(_) => `Symbol::${toString(aValue)}`
  }

let argsToString = (args: array<expressionValue>): string => {
  args->Belt.Array.map(arg => arg->toString)->Extra_Array.interperse(", ")->Js.String.concatMany("")
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
type environment = {dummy: int}
@genType
let defaultEnvironment: environment = {dummy: 0}
