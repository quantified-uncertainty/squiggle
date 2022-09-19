type internalExpressionValueType = Reducer_Value.internalExpressionValueType
type errorValue = Reducer_ErrorValue.errorValue

/*
  Function Registry "Type". A type, without any other information.
  Like, #Float
*/
type rec frType =
  | FRTypeNumber
  | FRTypeBool
  | FRTypeNumeric
  | FRTypeDate
  | FRTypeTimeDuration
  | FRTypeDistOrNumber
  | FRTypeDist
  | FRTypeLambda
  | FRTypeRecord(frTypeRecord)
  | FRTypeDict(frType)
  | FRTypeArray(frType)
  | FRTypeString
  | FRTypeAny
  | FRTypeVariant(array<string>)
and frTypeRecord = array<frTypeRecordParam>
and frTypeRecordParam = (string, frType)

/*
  Function Registry "Value". A type, with the information of that type.
  Like, #Float(40.0)
*/
type rec frValue =
  | FRValueNumber(float)
  | FRValueBool(bool)
  | FRValueDate(Js.Date.t)
  | FRValueTimeDuration(float)
  | FRValueDist(DistributionTypes.genericDist)
  | FRValueArray(array<frValue>)
  | FRValueDistOrNumber(frValueDistOrNumber)
  | FRValueRecord(frValueRecord)
  | FRValueLambda(Reducer_T.lambdaValue)
  | FRValueString(string)
  | FRValueVariant(string)
  | FRValueAny(frValue)
  | FRValueDict(Js.Dict.t<frValue>)
and frValueRecord = array<frValueRecordParam>
and frValueRecordParam = (string, frValue)
and frValueDictParam = (string, frValue)
and frValueDistOrNumber = FRValueNumber(float) | FRValueDist(DistributionTypes.genericDist)

type fnDefinition = {
  name: string,
  inputs: array<frType>,
  run: (
    array<Reducer_T.value>,
    array<frValue>,
    Reducer_T.environment,
    Reducer_T.reducerFn,
  ) => result<Reducer_T.value, errorValue>,
}

type function = {
  name: string,
  definitions: array<fnDefinition>,
  requiresNamespace: bool,
  nameSpace: string,
  output: option<internalExpressionValueType>,
  examples: array<string>,
  description: option<string>,
  isExperimental: bool,
}

module FRType = {
  type t = frType
  let rec toString = (t: t) =>
    switch t {
    | FRTypeNumber => "number"
    | FRTypeBool => "bool"
    | FRTypeDate => "date"
    | FRTypeTimeDuration => "duration"
    | FRTypeNumeric => "numeric"
    | FRTypeDist => "distribution"
    | FRTypeDistOrNumber => "distribution|number"
    | FRTypeRecord(r) => {
        let input = ((name, frType): frTypeRecordParam) => `${name}: ${toString(frType)}`
        `{${r->E.A2.fmap(input)->E.A2.joinWith(", ")}}`
      }
    | FRTypeArray(r) => `list(${toString(r)})`
    | FRTypeLambda => `lambda`
    | FRTypeString => `string`
    | FRTypeVariant(_) => "variant"
    | FRTypeDict(r) => `dict(${toString(r)})`
    | FRTypeAny => `any`
    }

  let rec toFrValue = (r: Reducer_T.value): option<frValue> =>
    // not all value variants are supported, but it's not important (we'll probably deprecate frValues soon anyway)
    switch r {
    | IEvNumber(f) => Some(FRValueNumber(f))
    | IEvString(f) => Some(FRValueString(f))
    | IEvDistribution(f) => Some(FRValueDistOrNumber(FRValueDist(f)))
    | IEvLambda(f) => Some(FRValueLambda(f))
    | IEvArray(elements) =>
      elements->E.A2.fmap(toFrValue)->E.A.O.openIfAllSome->E.O2.fmap(r => FRValueArray(r))
    | IEvRecord(map) =>
      Belt.Map.String.toArray(map)
      ->E.A2.fmap(((key, item)) => item->toFrValue->E.O2.fmap(o => (key, o)))
      ->E.A.O.openIfAllSome
      ->E.O2.fmap(r => FRValueRecord(r))
    | _ => None
    }

  let rec matchWithExpressionValue = (t: t, r: Reducer_T.value): option<frValue> =>
    switch (t, r) {
    | (FRTypeAny, f) => toFrValue(f)
    | (FRTypeString, IEvString(f)) => Some(FRValueString(f))
    | (FRTypeNumber, IEvNumber(f)) => Some(FRValueNumber(f))
    | (FRTypeBool, IEvBool(f)) => Some(FRValueBool(f))
    | (FRTypeDate, IEvDate(f)) => Some(FRValueDate(f))
    | (FRTypeTimeDuration, IEvTimeDuration(f)) => Some(FRValueTimeDuration(f))
    | (FRTypeDistOrNumber, IEvNumber(f)) => Some(FRValueDistOrNumber(FRValueNumber(f)))
    | (FRTypeDistOrNumber, IEvDistribution(Symbolic(#Float(f)))) =>
      Some(FRValueDistOrNumber(FRValueNumber(f)))
    | (FRTypeDistOrNumber, IEvDistribution(f)) => Some(FRValueDistOrNumber(FRValueDist(f)))
    | (FRTypeDist, IEvDistribution(f)) => Some(FRValueDist(f))
    | (FRTypeNumeric, IEvNumber(f)) => Some(FRValueNumber(f))
    | (FRTypeNumeric, IEvDistribution(Symbolic(#Float(f)))) => Some(FRValueNumber(f))
    | (FRTypeLambda, IEvLambda(f)) => Some(FRValueLambda(f))
    | (FRTypeArray(intendedType), IEvArray(elements)) => {
        let el = elements->E.A2.fmap(matchWithExpressionValue(intendedType))
        E.A.O.openIfAllSome(el)->E.O2.fmap(r => FRValueArray(r))
      }
    | (FRTypeDict(r), IEvRecord(map)) =>
      map
      ->Belt.Map.String.toArray
      ->E.A2.fmap(((key, item)) => matchWithExpressionValue(r, item)->E.O2.fmap(o => (key, o)))
      ->E.A.O.openIfAllSome
      ->E.O2.fmap(r => FRValueDict(Js.Dict.fromArray(r)))
    | (FRTypeRecord(recordParams), IEvRecord(map)) => {
        let getAndMatch = (name, input) =>
          Belt.Map.String.get(map, name)->E.O.bind(matchWithExpressionValue(input))
        //All names in the type must be present. If any are missing, the corresponding
        //value will be None, and this function would return None.
        let namesAndValues: array<option<(Js.Dict.key, frValue)>> =
          recordParams->E.A2.fmap(((name, input)) =>
            getAndMatch(name, input)->E.O2.fmap(match => (name, match))
          )
        namesAndValues->E.A.O.openIfAllSome->E.O2.fmap(r => FRValueRecord(r))
      }
    | _ => None
    }

  let rec matchReverse = (e: frValue): Reducer_T.value =>
    switch e {
    | FRValueNumber(f) => IEvNumber(f)
    | FRValueBool(f) => IEvBool(f)
    | FRValueDate(f) => IEvDate(f)
    | FRValueTimeDuration(f) => IEvTimeDuration(f)
    | FRValueDistOrNumber(FRValueNumber(n)) => IEvNumber(n)
    | FRValueDistOrNumber(FRValueDist(n)) => IEvDistribution(n)
    | FRValueDist(dist) => IEvDistribution(dist)
    | FRValueArray(elements) => IEvArray(elements->E.A2.fmap(matchReverse))
    | FRValueRecord(frValueRecord) => {
        let map =
          frValueRecord
          ->E.A2.fmap(((name, value)) => (name, matchReverse(value)))
          ->Belt.Map.String.fromArray
        IEvRecord(map)
      }
    | FRValueDict(frValueRecord) => {
        let map =
          frValueRecord
          ->Js.Dict.entries
          ->E.A2.fmap(((name, value)) => (name, matchReverse(value)))
          ->Belt.Map.String.fromArray
        IEvRecord(map)
      }
    | FRValueLambda(l) => IEvLambda(l)
    | FRValueString(string) => IEvString(string)
    | FRValueVariant(string) => IEvString(string)
    | FRValueAny(f) => matchReverse(f)
    }

  let matchWithExpressionValueArray = (inputs: array<t>, args: array<Reducer_T.value>): option<
    array<frValue>,
  > => {
    let isSameLength = E.A.length(inputs) == E.A.length(args)
    if !isSameLength {
      None
    } else {
      E.A.zip(inputs, args)
      ->E.A2.fmap(((input, arg)) => matchWithExpressionValue(input, arg))
      ->E.A.O.openIfAllSome
    }
  }
}

module FnDefinition = {
  type t = fnDefinition

  let toString = (t: t) => {
    let inputs = t.inputs->E.A2.fmap(FRType.toString)->E.A2.joinWith(", ")
    t.name ++ `(${inputs})`
  }

  let isMatch = (t: t, args: array<Reducer_T.value>) => {
    let argValues = FRType.matchWithExpressionValueArray(t.inputs, args)
    switch argValues {
    | Some(_) => true
    | None => false
    }
  }

  let run = (
    t: t,
    args: array<Reducer_T.value>,
    env: Reducer_T.environment,
    reducer: Reducer_T.reducerFn,
  ) => {
    let argValues = FRType.matchWithExpressionValueArray(t.inputs, args)
    switch argValues {
    | Some(values) => t.run(args, values, env, reducer)
    | None => REOther("Incorrect Types")->Error
    }
  }

  let make = (~name, ~inputs, ~run, ()): t => {
    name: name,
    inputs: inputs,
    run: run,
  }
}

module Function = {
  type t = function

  type functionJson = {
    name: string,
    definitions: array<string>,
    examples: array<string>,
    description: option<string>,
    isExperimental: bool,
  }

  let make = (
    ~name,
    ~nameSpace,
    ~requiresNamespace,
    ~definitions,
    ~examples=?,
    ~output=?,
    ~description=?,
    ~isExperimental=false,
    (),
  ): t => {
    name: name,
    nameSpace: nameSpace,
    definitions: definitions,
    output: output,
    examples: examples |> E.O.default([]),
    isExperimental: isExperimental,
    requiresNamespace: requiresNamespace,
    description: description,
  }

  let toJson = (t: t): functionJson => {
    name: t.name,
    definitions: t.definitions->E.A2.fmap(FnDefinition.toString),
    examples: t.examples,
    description: t.description,
    isExperimental: t.isExperimental,
  }
}

module Registry = {
  type fnNameDict = Belt.Map.String.t<array<fnDefinition>>
  type registry = {functions: array<function>, fnNameDict: fnNameDict}

  let toJson = (r: registry) => r.functions->E.A2.fmap(Function.toJson)
  let allExamples = (r: registry) => r.functions->E.A2.fmap(r => r.examples)->E.A.concatMany
  let allExamplesWithFns = (r: registry) =>
    r.functions->E.A2.fmap(fn => fn.examples->E.A2.fmap(example => (fn, example)))->E.A.concatMany

  let allNames = (r: registry) => r.fnNameDict->Belt.Map.String.keysToArray

  let _buildFnNameDict = (r: array<function>): fnNameDict => {
    // Three layers of reduce:
    // 1. functions
    // 2. definitions of each function
    // 3. name variations of each definition
    r->Belt.Array.reduce(Belt.Map.String.empty, (acc, fn) =>
      fn.definitions->Belt.Array.reduce(acc, (acc, def) => {
        let names =
          [
            fn.nameSpace == "" ? [] : [`${fn.nameSpace}.${def.name}`],
            fn.requiresNamespace ? [] : [def.name],
          ]->E.A.concatMany

        names->Belt.Array.reduce(acc, (acc, name) => {
          switch acc->Belt.Map.String.get(name) {
          | Some(fns) => {
              let _ = fns->Js.Array2.push(def) // mutates the array, no need to update acc
              acc
            }
          | None => acc->Belt.Map.String.set(name, [def])
          }
        })
      })
    )
  }

  let make = (fns: array<function>): registry => {
    let dict = _buildFnNameDict(fns)
    {functions: fns, fnNameDict: dict}
  }

  let call = (
    registry,
    fnName: string,
    args: array<Reducer_T.value>,
    env: Reducer_T.environment,
    reducer: Reducer_T.reducerFn,
  ): result<Reducer_T.value, errorValue> => {
    switch Belt.Map.String.get(registry.fnNameDict, fnName) {
    | Some(definitions) => {
        let showNameMatchDefinitions = () => {
          let defsString =
            definitions
            ->E.A2.fmap(FnDefinition.toString)
            ->E.A2.fmap(r => `[${r}]`)
            ->E.A2.joinWith("; ")
          `There are function matches for ${fnName}(), but with different arguments: ${defsString}`
        }

        let match = definitions->Js.Array2.find(def => def->FnDefinition.isMatch(args))
        switch match {
        | Some(def) => def->FnDefinition.run(args, env, reducer)
        | None => REOther(showNameMatchDefinitions())->Error
        }
      }
    | None => RESymbolNotFound(fnName)->Error
    }
  }
}
