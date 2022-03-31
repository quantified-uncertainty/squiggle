/*
  Irreducible values. Reducer does not know about those. Only used for external calls
  This is a configuration to to make external calls of those types
*/
module Extra_Array = Reducer_Extra_Array
module ErrorValue = Reducer_ErrorValue

type rec expressionValue =
  | EvBool(bool)
  | EvNumber(float)
  | EvString(string)
  | EvSymbol(string)
  | EvArray(array<expressionValue>)
  | EvRecord(Js.Dict.t<expressionValue>)

type functionCall = (string, array<expressionValue>)

let rec toString = aValue =>
  switch aValue {
  | EvBool(aBool) => Js.String.make(aBool)
  | EvNumber(aNumber) => Js.String.make(aNumber)
  | EvString(aString) => `'${aString}'`
  | EvSymbol(aString) => `:${aString}`
  | EvArray(anArray) => {
      let args =
        anArray->Belt.Array.map(each => toString(each))->Extra_Array.interperse(", ")->Js.String.concatMany("")
      `[${args}]`
    }
  | EvRecord(aRecord) => {
      let pairs =
        aRecord
        ->Js.Dict.entries
        ->Belt.Array.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
        ->Extra_Array.interperse(", ")
        ->Js.String.concatMany("")
      `{${pairs}}`
    }
  }

let toStringWithType = aValue =>
  switch aValue {
  | EvBool(_) => `Bool::${toString(aValue)}`
  | EvNumber(_) => `Number::${toString(aValue)}`
  | EvString(_) => `String::${toString(aValue)}`
  | EvSymbol(_) => `Symbol::${toString(aValue)}`
  | EvArray(_) => `Array::${toString(aValue)}`
  | EvRecord(_) => `Record::${toString(aValue)}`
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
