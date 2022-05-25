type expressionValue = ReducerInterface_ExpressionValue.expressionValue

/*
  Function Registry "Type". A type, without any other information.
  Like, #Float
*/
type rec frType =
  | FRTypeNumber
  | FRTypeNumeric
  | FRTypeDistOrNumber
  | FRTypeLambda
  | FRTypeRecord(frTypeRecord)
  | FRTypeArray(frType)
  | FRTypeOption(frType)
  | FRTypeString
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
  | FRValueOption(option<frValue>)
  | FRValueArray(array<frValue>)
  | FRValueDistOrNumber(frValueDistOrNumber)
  | FRValueRecord(frValueRecord)
  | FRValueLambda(ReducerInterface_ExpressionValue.lambdaValue)
  | FRValueString(string)
  | FRValueVariant(string)
and frValueRecord = array<frValueRecordParam>
and frValueRecordParam = (string, frValue)
and frValueDistOrNumber = FRValueNumber(float) | FRValueDist(DistributionTypes.genericDist)

type fnDefinition = {
  name: string,
  inputs: array<frType>,
  run: (array<frValue>, DistributionOperation.env) => result<expressionValue, string>,
}

type function = {
  name: string,
  definitions: array<fnDefinition>,
}

type registry = array<function>

module FRType = {
  type t = frType
  let rec toString = (t: t) =>
    switch t {
    | FRTypeNumber => "number"
    | FRTypeNumeric => "numeric"
    | FRTypeDistOrNumber => "frValueDistOrNumber"
    | FRTypeRecord(r) => {
        let input = ((name, frType): frTypeRecordParam) => `${name}: ${toString(frType)}`
        `record({${r->E.A2.fmap(input)->E.A2.joinWith(", ")}})`
      }
    | FRTypeArray(r) => `record(${toString(r)})`
    | FRTypeOption(v) => `option(${toString(v)})`
    | FRTypeLambda => `lambda`
    | FRTypeString => `string`
    | FRTypeVariant(_) => "variant"
    }

  let rec matchWithExpressionValue = (t: t, r: expressionValue): option<frValue> =>
    switch (t, r) {
    | (FRTypeNumber, EvNumber(f)) => Some(FRValueNumber(f))
    | (FRTypeDistOrNumber, EvNumber(f)) => Some(FRValueDistOrNumber(FRValueNumber(f)))
    | (FRTypeDistOrNumber, EvDistribution(Symbolic(#Float(f)))) =>
      Some(FRValueDistOrNumber(FRValueNumber(f)))
    | (FRTypeDistOrNumber, EvDistribution(f)) => Some(FRValueDistOrNumber(FRValueDist(f)))
    | (FRTypeNumeric, EvNumber(f)) => Some(FRValueNumber(f))
    | (FRTypeNumeric, EvDistribution(Symbolic(#Float(f)))) => Some(FRValueNumber(f))
    | (FRTypeOption(v), _) => Some(FRValueOption(matchWithExpressionValue(v, r)))
    | (FRTypeLambda, EvLambda(f)) => Some(FRValueLambda(f))
    | (FRTypeArray(intendedType), EvArray(elements)) => {
        let el = elements->E.A2.fmap(matchWithExpressionValue(intendedType))
        E.A.O.openIfAllSome(el)->E.O2.fmap(r => FRValueArray(r))
      }
    | (FRTypeRecord(recordParams), EvRecord(record)) => {
        let getAndMatch = (name, input) =>
          E.Dict.get(record, name)->E.O.bind(matchWithExpressionValue(input))
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

  let rec matchReverse = (e: frValue): expressionValue =>
    switch e {
    | FRValueNumber(f) => EvNumber(f)
    | FRValueDistOrNumber(FRValueNumber(n)) => EvNumber(n)
    | FRValueDistOrNumber(FRValueDist(n)) => EvDistribution(n)
    | FRValueDist(dist) => EvDistribution(dist)
    | FRValueOption(Some(r)) => matchReverse(r)
    | FRValueArray(elements) => EvArray(elements->E.A2.fmap(matchReverse))
    | FRValueRecord(frValueRecord) => {
        let record =
          frValueRecord->E.A2.fmap(((name, value)) => (name, matchReverse(value)))->E.Dict.fromArray
        EvRecord(record)
      }
    | FRValueLambda(l) => EvLambda(l)
    | FRValueString(string) => EvString(string)
    | FRValueVariant(string) => EvString(string)
    }

  // | FRValueOption(None) => break
  let matchWithExpressionValueArray = (inputs: array<t>, args: array<expressionValue>): option<
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
    let matchAssumingSameName = (f: fnDefinition, args: array<expressionValue>) => {
      switch FRType.matchWithExpressionValueArray(f.inputs, args) {
      | Some(_) => MatchSimple.FullMatch
      | None => MatchSimple.SameNameDifferentArguments
      }
    }

    let match = (f: fnDefinition, fnName: string, args: array<expressionValue>) => {
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

    let match = (f: function, fnName: string, args: array<expressionValue>): match => {
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
    let _findExactMatches = (r: registry, fnName: string, args: array<expressionValue>) => {
      let functionMatchPairs = r->E.A2.fmap(l => (l, Function.match(l, fnName, args)))
      let fullMatch = functionMatchPairs->E.A.getBy(((_, match)) => Match.isFullMatch(match))
      fullMatch->E.O.bind(((fn, match)) =>
        switch match {
        | FullMatch(index) => Some(RegistryMatch.makeMatch(fn.name, index))
        | _ => None
        }
      )
    }

    let _findNameMatches = (r: registry, fnName: string, args: array<expressionValue>) => {
      let functionMatchPairs = r->E.A2.fmap(l => (l, Function.match(l, fnName, args)))
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

    let findMatches = (r: registry, fnName: string, args: array<expressionValue>) => {
      switch _findExactMatches(r, fnName, args) {
      | Some(r) => Match.FullMatch(r)
      | None =>
        switch _findNameMatches(r, fnName, args) {
        | Some(r) => Match.SameNameDifferentArguments(r)
        | None => Match.DifferentName
        }
      }
    }

    let matchToDef = (registry: registry, {fnName, inputIndex}: RegistryMatch.match): option<
      fnDefinition,
    > =>
      registry
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

  let run = (t: t, args: array<expressionValue>, env: DistributionOperation.env) => {
    let argValues = FRType.matchWithExpressionValueArray(t.inputs, args)
    switch argValues {
    | Some(values) => t.run(values, env)
    | None => Error("Incorrect Types")
    }
  }

  let make = (~name, ~inputs, ~run): t => {
    name: name,
    inputs: inputs,
    run: run,
  }
}

module Function = {
  type t = function

  let make = (~name, ~definitions): t => {
    name: name,
    definitions: definitions,
  }
}

module Registry = {
  /*
  There's a (potential+minor) bug here: If a function definition is called outside of the calls 
  to the registry, then it's possible that there could be a match after the registry is 
  called. However, for now, we could just call the registry last.
 */
  let matchAndRun = (
    ~registry: registry,
    ~fnName: string,
    ~args: array<expressionValue>,
    ~env: DistributionOperation.env,
  ) => {
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
    switch Matcher.Registry.findMatches(registry, fnName, args) {
    | Matcher.Match.FullMatch(match) => match->matchToDef->E.O2.fmap(FnDefinition.run(_, args, env))
    | SameNameDifferentArguments(m) => Some(Error(showNameMatchDefinitions(m)))
    | _ => None
    }
  }
}
