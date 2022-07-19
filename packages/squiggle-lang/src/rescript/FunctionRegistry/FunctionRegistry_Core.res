type internalExpressionValue = ReducerInterface_InternalExpressionValue.t
type internalExpressionValueType = ReducerInterface_InternalExpressionValue.internalExpressionValueType

/*
  Function Registry "Type". A type, without any other information.
  Like, #Float
*/
type rec frType =
  | FRTypeNumber
  | FRTypeNumeric
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
  | FRValueDist(DistributionTypes.genericDist)
  | FRValueArray(array<frValue>)
  | FRValueDistOrNumber(frValueDistOrNumber)
  | FRValueRecord(frValueRecord)
  | FRValueLambda(ReducerInterface_InternalExpressionValue.lambdaValue)
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
    array<internalExpressionValue>,
    array<frValue>,
    GenericDist.env,
  ) => result<internalExpressionValue, string>,
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

type fnNameDict = Js.Dict.t<array<function>>
type registry = {functions: array<function>, fnNameDict: fnNameDict}

module FRType = {
  type t = frType
  let rec toString = (t: t) =>
    switch t {
    | FRTypeNumber => "number"
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

  let rec toFrValue = (r: internalExpressionValue): option<frValue> =>
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

  let rec matchWithExpressionValue = (t: t, r: internalExpressionValue): option<frValue> =>
    switch (t, r) {
    | (FRTypeAny, f) => toFrValue(f)
    | (FRTypeString, IEvString(f)) => Some(FRValueString(f))
    | (FRTypeNumber, IEvNumber(f)) => Some(FRValueNumber(f))
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

  let rec matchReverse = (e: frValue): internalExpressionValue =>
    switch e {
    | FRValueNumber(f) => IEvNumber(f)
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

  let matchWithExpressionValueArray = (
    inputs: array<t>,
    args: array<internalExpressionValue>,
  ): option<array<frValue>> => {
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

/*
  This module, Matcher, is fairly lengthy. However, only two functions from it
  are meant to be used outside of it. These are findMatches and matchToDef in Matches.Registry.
  The rest of it is just called from those two functions.
*/
module Matcher = {
  module MatchSimple = {
    type t = DifferentName | SameNameDifferentArguments | FullMatch

    let isFullMatch = (match: t) =>
      switch match {
      | FullMatch => true
      | _ => false
      }

    let isNameMatchOnly = (match: t) =>
      switch match {
      | SameNameDifferentArguments => true
      | _ => false
      }
  }

  module Match = {
    type t<'a, 'b> = DifferentName | SameNameDifferentArguments('a) | FullMatch('b)

    let isFullMatch = (match: t<'a, 'b>): bool =>
      switch match {
      | FullMatch(_) => true
      | _ => false
      }

    let isNameMatchOnly = (match: t<'a, 'b>) =>
      switch match {
      | SameNameDifferentArguments(_) => true
      | _ => false
      }
  }

  module FnDefinition = {
    let matchAssumingSameName = (f: fnDefinition, args: array<internalExpressionValue>) => {
      switch FRType.matchWithExpressionValueArray(f.inputs, args) {
      | Some(_) => MatchSimple.FullMatch
      | None => MatchSimple.SameNameDifferentArguments
      }
    }

    let match = (f: fnDefinition, fnName: string, args: array<internalExpressionValue>) => {
      if f.name !== fnName {
        MatchSimple.DifferentName
      } else {
        matchAssumingSameName(f, args)
      }
    }
  }

  module Function = {
    type definitionId = int
    type match = Match.t<array<definitionId>, definitionId>

    let match = (f: function, fnName: string, args: array<internalExpressionValue>): match => {
      let matchedDefinition = () =>
        E.A.getIndexBy(f.definitions, r =>
          MatchSimple.isFullMatch(FnDefinition.match(r, fnName, args))
        ) |> E.O.fmap(r => Match.FullMatch(r))
      let getMatchedNameOnlyDefinition = () => {
        let nameMatchIndexes =
          f.definitions
          ->E.A2.fmapi((index, r) =>
            MatchSimple.isNameMatchOnly(FnDefinition.match(r, fnName, args)) ? Some(index) : None
          )
          ->E.A.O.concatSomes
        switch nameMatchIndexes {
        | [] => None
        | elements => Some(Match.SameNameDifferentArguments(elements))
        }
      }

      E.A.O.firstSomeFnWithDefault(
        [matchedDefinition, getMatchedNameOnlyDefinition],
        Match.DifferentName,
      )
    }
  }

  module RegistryMatch = {
    type match = {
      fnName: string,
      inputIndex: int,
    }
    let makeMatch = (fnName: string, inputIndex: int) => {fnName: fnName, inputIndex: inputIndex}
  }

  module Registry = {
    let _findExactMatches = (r: registry, fnName: string, args: array<internalExpressionValue>) => {
      let functionMatchPairs = r.functions->E.A2.fmap(l => (l, Function.match(l, fnName, args)))
      let fullMatch = functionMatchPairs->E.A.getBy(((_, match)) => Match.isFullMatch(match))
      fullMatch->E.O.bind(((fn, match)) =>
        switch match {
        | FullMatch(index) => Some(RegistryMatch.makeMatch(fn.name, index))
        | _ => None
        }
      )
    }

    let _findNameMatches = (r: registry, fnName: string, args: array<internalExpressionValue>) => {
      let functionMatchPairs = r.functions->E.A2.fmap(l => (l, Function.match(l, fnName, args)))
      let getNameMatches =
        functionMatchPairs
        ->E.A2.fmap(((fn, match)) => Match.isNameMatchOnly(match) ? Some((fn, match)) : None)
        ->E.A.O.concatSomes
      let matches =
        getNameMatches
        ->E.A2.fmap(((fn, match)) =>
          switch match {
          | SameNameDifferentArguments(indexes) =>
            indexes->E.A2.fmap(index => RegistryMatch.makeMatch(fn.name, index))
          | _ => []
          }
        )
        ->Belt.Array.concatMany
      E.A.toNoneIfEmpty(matches)
    }

    let findMatches = (r: registry, fnName: string, args: array<internalExpressionValue>) => {
      let fnNameInParts = Js.String.split(".", fnName)
      let fnToSearch = E.A.get(fnNameInParts, 1) |> E.O.default(fnNameInParts[0])

      switch _findExactMatches(r, fnToSearch, args) {
      | Some(r) => Match.FullMatch(r)
      | None =>
        switch _findNameMatches(r, fnToSearch, args) {
        | Some(r) => Match.SameNameDifferentArguments(r)
        | None => Match.DifferentName
        }
      }
    }

    let matchToDef = (registry: registry, {fnName, inputIndex}: RegistryMatch.match): option<
      fnDefinition,
    > =>
      registry.functions
      ->E.A.getBy(fn => fn.name === fnName)
      ->E.O.bind(fn => E.A.get(fn.definitions, inputIndex))
  }
}

module FnDefinition = {
  type t = fnDefinition

  let toString = (t: t) => {
    let inputs = t.inputs->E.A2.fmap(FRType.toString)->E.A2.joinWith(", ")
    t.name ++ `(${inputs})`
  }

  let isMatch = (t: t, args: array<internalExpressionValue>) => {
    let argValues = FRType.matchWithExpressionValueArray(t.inputs, args)
    switch argValues {
    | Some(_) => true
    | None => false
    }
  }

  let run = (t: t, args: array<internalExpressionValue>, env: GenericDist.env) => {
    let argValues = FRType.matchWithExpressionValueArray(t.inputs, args)
    switch argValues {
    | Some(values) => t.run(args, values, env)
    | None => Error("Incorrect Types")
    }
  }

  let toFfiFn = (t: t): Reducer_Expression_T.optionFfiFn =>
    (args, environment) => run(t, args, environment)->E.R.toOption

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

module NameSpace = {
  type t = {name: string, functions: array<function>}
  let definitions = (t: t) => t.functions->E.A2.fmap(f => f.definitions)->E.A.concatMany
  let uniqueFnNames = (t: t) => definitions(t)->E.A2.fmap(r => r.name)->E.A.uniq
  let nameToDefinitions = (t: t, name: string) => definitions(t)->E.A2.filter(r => r.name == name)
}

module Registry = {
  let toJson = (r: registry) => r.functions->E.A2.fmap(Function.toJson)
  let allExamples = (r: registry) => r.functions->E.A2.fmap(r => r.examples)->E.A.concatMany
  let allExamplesWithFns = (r: registry) =>
    r.functions->E.A2.fmap(fn => fn.examples->E.A2.fmap(example => (fn, example)))->E.A.concatMany

  let buildFnNameDict = (r: array<function>): fnNameDict => {
    let allDefinitionsWithFns =
      r
      ->E.A2.fmap(fn => fn.definitions->E.A2.fmap(definitions => (fn, definitions)))
      ->E.A.concatMany
    let functionsWithFnNames =
      allDefinitionsWithFns
      ->E.A2.fmap(((fn, def)) => {
        let nameWithNamespace = `${fn.nameSpace}.${def.name}`
        let nameWithoutNamespace = def.name
        fn.requiresNamespace
          ? [(nameWithNamespace, fn)]
          : [(nameWithNamespace, fn), (nameWithoutNamespace, fn)]
      })
      ->E.A.concatMany
    let uniqueNames = functionsWithFnNames->E.A2.fmap(((name, _)) => name)->E.A.uniq
    let cacheAsArray: array<(string, array<function>)> = uniqueNames->E.A2.fmap(uniqueName => {
      let relevantItems =
        E.A2.filter(functionsWithFnNames, ((defName, _)) => defName == uniqueName)->E.A2.fmap(
          E.Tuple2.second,
        )
      (uniqueName, relevantItems)
    })
    cacheAsArray->Js.Dict.fromArray
  }

  let make = (fns: array<function>): registry => {
    let dict = buildFnNameDict(fns)
    {functions: fns, fnNameDict: dict}
  }

  /*
  There's a (potential+minor) bug here: If a function definition is called outside of the calls 
  to the registry, then it's possible that there could be a match after the registry is 
  called. However, for now, we could just call the registry last.
 */
  let _matchAndRun = (
    ~registry: registry,
    ~fnName: string,
    ~args: array<internalExpressionValue>,
    ~env: GenericDist.env,
  ) => {
    let relevantFunctions = Js.Dict.get(registry.fnNameDict, fnName) |> E.O.default([])
    let modified = {functions: relevantFunctions, fnNameDict: registry.fnNameDict}
    let matchToDef = m => Matcher.Registry.matchToDef(registry, m)
    let showNameMatchDefinitions = matches => {
      let defs =
        matches
        ->E.A2.fmap(matchToDef)
        ->E.A.O.concatSomes
        ->E.A2.fmap(FnDefinition.toString)
        ->E.A2.fmap(r => `[${r}]`)
        ->E.A2.joinWith("; ")
      `There are function matches for ${fnName}(), but with different arguments: ${defs}`
    }

    switch Matcher.Registry.findMatches(modified, fnName, args) {
    | Matcher.Match.FullMatch(match) => match->matchToDef->E.O2.fmap(FnDefinition.run(_, args, env))
    | SameNameDifferentArguments(m) => Some(Error(showNameMatchDefinitions(m)))
    | _ => None
    }
  }

  let dispatch = (
    registry,
    (fnName, args): ReducerInterface_InternalExpressionValue.functionCall,
    env,
  ) => {
    _matchAndRun(~registry, ~fnName, ~args, ~env)->E.O2.fmap(
      E.R2.errMap(_, s => Reducer_ErrorValue.RETodo(s)),
    )
  }
}
