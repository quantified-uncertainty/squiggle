module ErrorValue = Reducer_ErrorValue
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module Result = Belt.Result

type errorValue = Reducer_ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue
type externalBindings = ReducerInterface_ExpressionValue.externalBindings

let defaultBindings: ExpressionT.bindings = Belt.Map.String.empty

let typeAliasesKey = "_typeAliases_"
let typeReferencesKey = "_typeReferences_"

let toExternalBindings = (bindings: ExpressionT.bindings): externalBindings => {
  let keys = Belt.Map.String.keysToArray(bindings)
  keys->Belt.Array.reduce(Js.Dict.empty(), (acc, key) => {
    let value = bindings->Belt.Map.String.getExn(key)
    Js.Dict.set(acc, key, value)
    acc
  })
}

let fromExternalBindings_ = (externalBindings: externalBindings): ExpressionT.bindings => {
  let keys = Js.Dict.keys(externalBindings)
  keys->Belt.Array.reduce(defaultBindings, (acc, key) => {
    let value = Js.Dict.unsafeGet(externalBindings, key)
    acc->Belt.Map.String.set(key, value)
  })
}

let fromExternalBindings = (externalBindings: externalBindings): ExpressionT.bindings => {
  // TODO: This code will be removed in the future when maps are used instead of records. Please don't mind this function for now.

  let internalBindings0 = fromExternalBindings_(externalBindings)

  let oExistingTypeAliases = Belt.Map.String.get(internalBindings0, typeAliasesKey)
  let internalBindings1 = Belt.Option.mapWithDefault(
    oExistingTypeAliases,
    internalBindings0,
    existingTypeAliases => {
      let newTypeAliases = switch existingTypeAliases {
      | EvRecord(actualTypeAliases) =>
        actualTypeAliases->fromExternalBindings_->toExternalBindings->ExpressionValue.EvRecord
      | _ => existingTypeAliases
      }
      Belt.Map.String.set(internalBindings0, typeAliasesKey, newTypeAliases)
    },
  )

  let oExistingTypeReferences = Belt.Map.String.get(internalBindings1, typeReferencesKey)
  let internalBindings2 = Belt.Option.mapWithDefault(
    oExistingTypeReferences,
    internalBindings1,
    existingTypeReferences => {
      let newTypeReferences = switch existingTypeReferences {
      | EvRecord(actualTypeReferences) =>
        actualTypeReferences->fromExternalBindings_->toExternalBindings->ExpressionValue.EvRecord
      | _ => existingTypeReferences
      }
      Belt.Map.String.set(internalBindings0, typeReferencesKey, newTypeReferences)
    },
  )

  internalBindings2
}

let fromValue = (aValue: expressionValue) =>
  switch aValue {
  | EvRecord(externalBindings) => fromExternalBindings(externalBindings)
  | _ => defaultBindings
  }

let externalFromArray = anArray => Js.Dict.fromArray(anArray)

let isMacroName = (fName: string): bool => fName->Js.String2.startsWith("$$")

let rec replaceSymbols = (bindings: ExpressionT.bindings, expression: expression): result<
  expression,
  errorValue,
> =>
  switch expression {
  | ExpressionT.EValue(value) =>
    replaceSymbolOnValue(bindings, value)->Result.map(evValue => evValue->ExpressionT.EValue)
  | ExpressionT.EList(list) =>
    switch list {
    | list{EValue(EvCall(fName)), ..._args} =>
      switch isMacroName(fName) {
      // A macro reduces itself so we dont dive in it
      | true => expression->Ok
      | false => replaceSymbolsOnExpressionList(bindings, list)
      }
    | _ => replaceSymbolsOnExpressionList(bindings, list)
    }
  }

and replaceSymbolsOnExpressionList = (bindings, list) => {
  let racc = list->Belt.List.reduceReverse(Ok(list{}), (racc, each: expression) =>
    racc->Result.flatMap(acc => {
      replaceSymbols(bindings, each)->Result.flatMap(newNode => {
        acc->Belt.List.add(newNode)->Ok
      })
    })
  )
  racc->Result.map(acc => acc->ExpressionT.EList)
}
and replaceSymbolOnValue = (bindings, evValue: expressionValue) =>
  switch evValue {
  | EvSymbol(symbol) => Belt.Map.String.getWithDefault(bindings, symbol, evValue)->Ok
  | EvCall(symbol) => Belt.Map.String.getWithDefault(bindings, symbol, evValue)->checkIfCallable
  | _ => evValue->Ok
  }
and checkIfCallable = (evValue: expressionValue) =>
  switch evValue {
  | EvCall(_) | EvLambda(_) => evValue->Ok
  | _ => ErrorValue.RENotAFunction(ExpressionValue.toString(evValue))->Error
  }

let toString = (bindings: ExpressionT.bindings) =>
  bindings->toExternalBindings->ExpressionValue.EvRecord->ExpressionValue.toString

let externalBindingsToString = (externalBindings: externalBindings) =>
  externalBindings->ExpressionValue.EvRecord->ExpressionValue.toString
