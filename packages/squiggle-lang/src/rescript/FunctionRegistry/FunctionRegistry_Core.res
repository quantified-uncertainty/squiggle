type expressionValue = ReducerInterface_ExpressionValue.expressionValue

type rec itype =
  | I_Number
  | I_Numeric
  | I_DistOrNumber
  | I_Record(iRecord)
  | I_Array(array<itype>)
  | I_Option(itype)
and iRecord = array<iRecordParam>
and iRecordParam = (string, itype)

module Itype = {
  let rec toString = (t: itype) =>
    switch t {
    | I_Number => "number"
    | I_Numeric => "numeric"
    | I_DistOrNumber => "distOrNumber"
    | I_Record(r) => {
        let input = ((name, itype): iRecordParam) => `${name}: ${toString(itype)}`
        `record({${r->E.A2.fmap(input)->E.A2.joinWith(", ")}})`
      }
    | I_Array(r) => `record(${r->E.A2.fmap(toString)->E.A2.joinWith(", ")})`
    | I_Option(v) => `option(${toString(v)})`
    }
}

type rec value =
  | Number(float)
  | Dist(DistributionTypes.genericDist)
  | Option(option<value>)
  | DistOrNumber(distOrNumber)
  | Record(record)
and record = array<(string, value)>
and distOrNumber = Number(float) | Dist(DistributionTypes.genericDist)

type runFn = array<value> => result<expressionValue, string>

type fnDefinition = {name: string, inputs: array<itype>, run: runFn}

type function = {
  name: string,
  definitions: array<fnDefinition>,
}

type registry = array<function>

let rec matchInput = (input: itype, r: expressionValue): option<value> =>
  switch (input, r) {
  | (I_Number, EvNumber(f)) => Some(Number(f))
  | (I_DistOrNumber, EvNumber(f)) => Some(DistOrNumber(Number(f)))
  | (I_DistOrNumber, EvDistribution(Symbolic(#Float(f)))) => Some(DistOrNumber(Number(f)))
  | (I_DistOrNumber, EvDistribution(f)) => Some(DistOrNumber(Dist(f)))
  | (I_Numeric, EvNumber(f)) => Some(Number(f))
  | (I_Numeric, EvDistribution(Symbolic(#Float(f)))) => Some(Number(f))
  | (I_Option(v), _) => Some(Option(matchInput(v, r)))
  | (I_Record(recordParams), EvRecord(record)) => {
      let getAndMatch = (name, input) =>
        E.Dict.get(record, name)->E.O.bind(v => matchInput(input, v))
      let arrayOfNameValues: array<(Js.Dict.key, option<value>)> =
        recordParams->E.A2.fmap(((name, input)) => (name, getAndMatch(name, input)))
      let hasNullValues = E.A.hasBy(arrayOfNameValues, ((_, value)) => E.O.isNone(value))
      if hasNullValues {
        None
      } else {
        arrayOfNameValues
        ->E.A2.fmap(((name, value)) => (name, value->E.O2.toExn("")))
        ->(r => Some(Record(r)))
      }
    }
  | _ => None
  }

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
    type definitionMatch = MatchSimple.t

    let getArgValues = (f: fnDefinition, args: array<expressionValue>): option<array<value>> => {
      let mainInputTypes = f.inputs
      if E.A.length(f.inputs) !== E.A.length(args) {
        None
      } else {
        E.A.zip(mainInputTypes, args)
        ->E.A2.fmap(((input, arg)) => matchInput(input, arg))
        ->E.A.O.openIfAllSome
      }
    }

    let matchAssumingSameName = (f: fnDefinition, args: array<expressionValue>) => {
      switch getArgValues(f, args) {
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
    type t = Match.t<array<match>, match>
    let makeMatch = (fnName: string, inputIndex: int) => {fnName: fnName, inputIndex: inputIndex}
  }

  module Registry = {
    let findExactMatches = (r: registry, fnName: string, args: array<expressionValue>) => {
      let functionMatchPairs = r->E.A2.fmap(l => (l, Function.match(l, fnName, args)))
      let getFullMatch = E.A.getBy(functionMatchPairs, ((_, match: Function.match)) =>
        Match.isFullMatch(match)
      )
      let fullMatch: option<RegistryMatch.match> = getFullMatch->E.O.bind(((fn, match)) =>
        switch match {
        | FullMatch(index) => Some(RegistryMatch.makeMatch(fn.name, index))
        | _ => None
        }
      )
      fullMatch
    }

    let findNameMatches = (r: registry, fnName: string, args: array<expressionValue>) => {
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
      switch findExactMatches(r, fnName, args) {
      | Some(r) => Match.FullMatch(r)
      | None =>
        switch findNameMatches(r, fnName, args) {
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
  let getArgValues = (t: t, args: array<expressionValue>): option<array<value>> => {
    let mainInputTypes = t.inputs
    if E.A.length(t.inputs) !== E.A.length(args) {
      None
    } else {
      E.A.zip(mainInputTypes, args)
      ->E.A2.fmap(((input, arg)) => matchInput(input, arg))
      ->E.A.O.openIfAllSome
    }
  }

  let defToString = (t: t) => t.inputs->E.A2.fmap(Itype.toString)->E.A2.joinWith(", ")

  let run = (t: t, args: array<expressionValue>) => {
    let argValues = getArgValues(t, args)
    switch argValues {
    | Some(values) => t.run(values)
    | None => Error("Impossible")
    }
  }
}

module Function = {
  type definitionId = int
  let make = (~name, ~definitions): function => {
    name: name,
    definitions: definitions,
  }

  let makeDefinition = (~name, ~inputs, ~run): fnDefinition => {
    name: name,
    inputs: inputs,
    run: run,
  }
}

module Registry = {
  let matchAndRun = (r: registry, fnName: string, args: array<expressionValue>) => {
    let matchToDef = m => Matcher.Registry.matchToDef(r, m)
    let showNameMatchDefinitions = matches => {
      let defs =
        matches
        ->E.A2.fmap(matchToDef)
        ->E.A.O.concatSomes
        ->E.A2.fmap(r => `[${fnName}(${FnDefinition.defToString(r)})]`)
        ->E.A2.joinWith("; ")
      `There are function matches for ${fnName}(), but with different arguments: ${defs}`
    }
    switch Matcher.Registry.findMatches(r, fnName, args) {
    | Matcher.Match.FullMatch(match) => match->matchToDef->E.O2.fmap(FnDefinition.run(_, args))
    | SameNameDifferentArguments(m) => Some(Error(showNameMatchDefinitions(m)))
    | _ => None
    }
  }
}
