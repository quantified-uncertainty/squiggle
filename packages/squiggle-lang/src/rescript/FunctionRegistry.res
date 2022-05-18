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
    let inputTypes = f.inputs
    if E.A.length(f.inputs) !== E.A.length(args) {
      None
    } else {
      let foo = E.A.zip(inputTypes, args)
      ->(e => {Js.log2("Here", e); e})
      ->E.A2.fmap(((input, arg)) => matchInput(input, arg))
      ->(e => {Js.log2("Here2", e); e})
      ->E.A.O.openIfAllSome
      ->(e => {Js.log2("Here3", e); e});
      foo
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

  let run = (f: fnDefinition, args: array<expressionValue>) => {
      Js.log3("Run", f, args)
    let argValues = getArgValues(f, args)
      Js.log2("RunArgValues", argValues)
    switch argValues {
    | Some(values) => f.run(values)
    | None => Error("Impossible")
    }
  }
}

module Function = {
  type definitionId = int
  type match = Match.t<array<definitionId>, definitionId>

  let make = (name, definitions): function => {
    name: name,
    definitions: definitions,
  }
  let makeDefinition = (name, inputs, run): fnDefinition => {
    name: name,
    inputs: inputs,
    run: run,
  }

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

  let fullMatchToDef = (registry: registry, {fnName, inputIndex}: RegistryMatch.match): option<
    fnDefinition,
  > =>
    registry
    ->E.A.getBy(fn => fn.name === fnName)
    ->E.O.bind(fn => E.A.get(fn.definitions, inputIndex))

  let matchAndRun = (r: registry, fnName: string, args: array<expressionValue>) => {
    switch findMatches(r, fnName, args) {
    | Match.FullMatch(m) => fullMatchToDef(r, m)->E.O2.fmap(r => {
        FnDefinition.run(r, args)
    })
    | _ => None
    }
  }
}

let twoNumberInputs = (inputs: array<value>) =>{
    Js.log2("HII",inputs);
  switch inputs {
  | [Number(n1), Number(n2)] => Ok(n1, n2)
  | _ => Error("Wrong inputs / Logically impossible")
  }
}

let twoNumberInputsRecord = (v1, v2, inputs: array<value>) =>
  switch inputs {
  | [Record([(name1, n1), (name2, n2)])] if name1 == v1 && name2 == v2 => twoNumberInputs([n1, n2])
  | _ => Error("Wrong inputs / Logically impossible")
  }

let contain = r => ReducerInterface_ExpressionValue.EvDistribution(Symbolic(r))

let meanStdev = (mean, stdev) => SymbolicDist.Normal.make(mean, stdev)->E.R2.fmap(contain)

let p5and95 = (p5, p95) => contain(SymbolicDist.Normal.from90PercentCI(p5, p95))

let convertTwoInputs = (inputs: array<value>): result<expressionValue, string> =>
  twoNumberInputs(inputs)->E.R.bind(((mean, stdev)) => meanStdev(mean, stdev))

let normal = Function.make(
  "Normal",
  [
    Function.makeDefinition("normal", [I_Numeric, I_Numeric], inputs =>
      twoNumberInputs(inputs)->E.R.bind(((mean, stdev)) => meanStdev(mean, stdev))
    ),
    Function.makeDefinition(
      "normal",
      [I_Record([("mean", I_Numeric), ("stdev", I_Numeric)])],
      inputs =>
        twoNumberInputsRecord("mean", "stdev", inputs)->E.R.bind(((mean, stdev)) =>
          meanStdev(mean, stdev)
        ),
    ),
    Function.makeDefinition("normal", [I_Record([("p5", I_Numeric), ("p95", I_Numeric)])], inputs =>
      twoNumberInputsRecord("p5", "p95", inputs)->E.R.bind(((mean, stdev)) =>
        Ok(p5and95(mean, stdev))
      )
    ),
  ],
)
