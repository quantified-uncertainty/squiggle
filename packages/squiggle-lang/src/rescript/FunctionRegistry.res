type expressionValue = ReducerInterface_ExpressionValue.expressionValue

type rec itype =
  I_Number | I_DistOrNumber | I_Record(iRecord) | I_Array(array<itype>) | I_Option(itype)
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

type runFn = array<value> => result<ReducerInterface_ExpressionValue.expressionValue, string>

type fnDefinition = {name: string, inputs: array<itype>, run: runFn}

type function = {
  name: string,
  definitions: array<fnDefinition>,
}

let rec matchInput = (input: itype, r: expressionValue): option<value> =>
  switch (input, r) {
  | (I_Number, EvNumber(f)) => Some(Number(f))
  | (I_DistOrNumber, EvNumber(f)) => Some(DistOrNumber(Number(f)))
  | (I_DistOrNumber, EvDistribution(f)) => Some(DistOrNumber(Dist(f)))
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

type match = DifferentName | SameNameDifferentArguments(string) | Match(string, array<value>)

let isFullMatch = (match: match) =>
  switch match {
  | Match(_, _) => true
  | _ => false
  }

let isNameMatchOnly = (match: match) =>
  switch match {
  | SameNameDifferentArguments(_) => true
  | _ => false
  }

let matchSingle = (f: fnDefinition, fnName: string, args: array<expressionValue>) => {
  if f.name !== fnName {
    DifferentName
  } else {
    let inputTypes = f.inputs
    if E.A.length(f.inputs) !== E.A.length(args) {
      SameNameDifferentArguments(f.name)
    } else {
      let foo =
        E.A.zip(inputTypes, args)
        ->E.A2.fmap(((input, arg)) => matchInput(input, arg))
        ->E.A.O.arrSomeToSomeArr
      switch foo {
      | Some(r) => Match(f.name, r)
      | None => SameNameDifferentArguments(f.name)
      }
    }
  }
}

let getByOpen = (a,op,bin) => switch(E.A.getBy(a, r => bin(op(r)))) {
  | Some(r) => Some(op(r))
  | None => None
}

let match = (f: function, fnName: string, args: array<expressionValue>) => {
  let matchedDefinition = E.A.getBy(f.definitions, r => isFullMatch(matchSingle(r, fnName, args)))
  switch matchedDefinition {
  | Some(matchedDefinition) => {
      let match = matchSingle(matchedDefinition, fnName, args)
      switch match {
      | Match(a, b) => Ok(Match(a, b))
      | _ => Error("Should be Impossible")
      }
    }
  | None => {
      let matchedNameDefinition = E.A.getBy(f.definitions, r =>
        isNameMatchOnly(matchSingle(r, fnName, args))
      )
      let foo = switch matchedNameDefinition {
      | Some(matchedNameDefinition) =>
        switch matchSingle(matchedNameDefinition, fnName, args) {
        | SameNameDifferentArguments(r) => Ok(SameNameDifferentArguments(r))
        | _ => Error("Should be Impossible")
        }
      | _ => Ok(DifferentName)
      }
      foo
    }
  }
}
