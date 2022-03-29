/*
  Irreducible values. Reducer does not know about those. Only used for external calls
  This is a configuration to to make external calls of those types
*/
module AE = Reducer_Extra_Array
module ErrorValue = Reducer_ErrorValue

type rec expressionValue =
  | EvBool(bool)
  | EvNumber(float)
  | EvString(string)
  | EvSymbol(string)
  | EvArray(array<expressionValue>)
  | EvRecord(Js.Dict.t<expressionValue>)

type functionCall = (string, array<expressionValue>)

let rec show = aValue =>
  switch aValue {
  | EvBool(aBool) => Js.String.make(aBool)
  | EvNumber(aNumber) => Js.String.make(aNumber)
  | EvString(aString) => `'${aString}'`
  | EvSymbol(aString) => `:${aString}`
  | EvArray(anArray) => {
      let args =
        anArray->Belt.Array.map(each => show(each))->AE.interperse(", ")->Js.String.concatMany("")
      `[${args}]`
    }
  | EvRecord(aRecord) => {
      let pairs =
        aRecord
        ->Js.Dict.entries
        ->Belt.Array.map(((eachKey, eachValue)) => `${eachKey}: ${show(eachValue)}`)
        ->AE.interperse(", ")
        ->Js.String.concatMany("")
      `{${pairs}}`
    }
  }

let showWithType = aValue =>
  switch aValue {
  | EvBool(_) => `Bool::${show(aValue)}`
  | EvNumber(_) => `Number::${show(aValue)}`
  | EvString(_) => `String::${show(aValue)}`
  | EvSymbol(_) => `Symbol::${show(aValue)}`
  | EvArray(_) => `Array::${show(aValue)}`
  | EvRecord(_) => `Record::${show(aValue)}`
  }

let showArgs = (args: array<expressionValue>): string => {
  args->Belt.Array.map(arg => arg->show)->AE.interperse(", ")->Js.String.concatMany("")
}

let showFunctionCall = ((fn, args)): string => `${fn}(${showArgs(args)})`

let showResult = x =>
  switch x {
  | Ok(a) => `Ok(${show(a)})`
  | Error(m) => `Error(${ErrorValue.showError(m)})`
  }
