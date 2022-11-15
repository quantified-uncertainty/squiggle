type internalExpressionValueType = Reducer_Value.internalExpressionValueType
type errorMessage = SqError.Message.t

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

type frValueDistOrNumber = FRValueNumber(float) | FRValueDist(DistributionTypes.genericDist)

type fnDefinition = {
  name: string,
  inputs: array<frType>,
  run: (
    array<Reducer_T.value>,
    Reducer_T.context,
    Reducer_T.reducerFn,
  ) => result<Reducer_T.value, errorMessage>,
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
        `{${r->E.A.fmap(input)->E.A.joinWith(", ")}}`
      }

    | FRTypeArray(r) => `list(${toString(r)})`
    | FRTypeLambda => `lambda`
    | FRTypeString => `string`
    | FRTypeVariant(_) => "variant"
    | FRTypeDict(r) => `dict(${toString(r)})`
    | FRTypeAny => `any`
    }

  let rec matchWithValue = (t: t, r: Reducer_T.value): bool =>
    switch (t, r) {
    | (FRTypeAny, _) => true
    | (FRTypeString, IEvString(_)) => true
    | (FRTypeNumber, IEvNumber(_)) => true
    | (FRTypeBool, IEvBool(_)) => true
    | (FRTypeDate, IEvDate(_)) => true
    | (FRTypeTimeDuration, IEvTimeDuration(_)) => true
    | (FRTypeDistOrNumber, IEvNumber(_)) => true
    | (FRTypeDistOrNumber, IEvDistribution(_)) => true
    | (FRTypeDist, IEvDistribution(_)) => true
    | (FRTypeNumeric, IEvNumber(_)) => true
    | (FRTypeNumeric, IEvDistribution(Symbolic(#Float(_)))) => true
    | (FRTypeLambda, IEvLambda(_)) => true
    | (FRTypeArray(intendedType), IEvArray(elements)) =>
      elements->E.A.every(v => matchWithValue(intendedType, v))
    | (FRTypeDict(r), IEvRecord(map)) =>
      map->Belt.Map.String.valuesToArray->E.A.every(v => matchWithValue(r, v))
    | (FRTypeRecord(recordParams), IEvRecord(map)) =>
      recordParams->E.A.every(((name, input)) => {
        switch map->Belt.Map.String.get(name) {
        | Some(v) => matchWithValue(input, v)
        | None => false
        }
      })
    | _ => false
    }

  let matchWithValueArray = (inputs: array<t>, args: array<Reducer_T.value>): bool => {
    let isSameLength = E.A.length(inputs) == E.A.length(args)
    if !isSameLength {
      false
    } else {
      E.A.zip(inputs, args)->E.A.every(((input, arg)) => matchWithValue(input, arg))
    }
  }
}

module FnDefinition = {
  type t = fnDefinition

  let toString = (t: t) => {
    let inputs = t.inputs->E.A.fmap(FRType.toString)->E.A.joinWith(", ")
    t.name ++ `(${inputs})`
  }

  let isMatch = (t: t, args: array<Reducer_T.value>) => {
    FRType.matchWithValueArray(t.inputs, args)
  }

  let run = (
    t: t,
    args: array<Reducer_T.value>,
    context: Reducer_T.context,
    reducer: Reducer_T.reducerFn,
  ) => {
    switch t->isMatch(args) {
    | true => t.run(args, context, reducer)
    | false => REOther("Incorrect Types")->Error
    }
  }

  let make = (~name, ~inputs, ~run, ()): t => {
    name,
    inputs,
    run,
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
    name,
    nameSpace,
    definitions,
    output,
    examples: examples->E.O.default([]),
    isExperimental,
    requiresNamespace,
    description,
  }

  let toJson = (t: t): functionJson => {
    name: t.name,
    definitions: t.definitions->E.A.fmap(FnDefinition.toString),
    examples: t.examples,
    description: t.description,
    isExperimental: t.isExperimental,
  }
}

module Registry = {
  type fnNameDict = Belt.Map.String.t<array<fnDefinition>>
  type registry = {functions: array<function>, fnNameDict: fnNameDict}

  let toJson = (r: registry) => r.functions->E.A.fmap(Function.toJson)
  let allExamples = (r: registry) => r.functions->E.A.fmap(r => r.examples)->E.A.concatMany
  let allExamplesWithFns = (r: registry) =>
    r.functions->E.A.fmap(fn => fn.examples->E.A.fmap(example => (fn, example)))->E.A.concatMany

  let allNames = (r: registry) => r.fnNameDict->Belt.Map.String.keysToArray

  let _buildFnNameDict = (r: array<function>): fnNameDict => {
    // Three layers of reduce:
    // 1. functions
    // 2. definitions of each function
    // 3. name variations of each definition
    r->E.A.reduce(Belt.Map.String.empty, (acc, fn) =>
      fn.definitions->E.A.reduce(acc, (acc, def) => {
        let names =
          [
            fn.nameSpace == "" ? [] : [`${fn.nameSpace}.${def.name}`],
            fn.requiresNamespace ? [] : [def.name],
          ]->E.A.concatMany

        names->E.A.reduce(
          acc,
          (acc, name) => {
            switch acc->Belt.Map.String.get(name) {
            | Some(fns) => {
                let _ = fns->Js.Array2.push(def) // mutates the array, no need to update acc
                acc
              }

            | None => acc->Belt.Map.String.set(name, [def])
            }
          },
        )
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
    context: Reducer_T.context,
    reducer: Reducer_T.reducerFn,
  ): result<Reducer_T.value, errorMessage> => {
    switch Belt.Map.String.get(registry.fnNameDict, fnName) {
    | Some(definitions) => {
        let showNameMatchDefinitions = () => {
          let defsString =
            definitions
            ->E.A.fmap(FnDefinition.toString)
            ->E.A.fmap(r => `[${r}]`)
            ->E.A.joinWith("; ")
          `There are function matches for ${fnName}(), but with different arguments: ${defsString}`
        }

        let match = definitions->Js.Array2.find(def => def->FnDefinition.isMatch(args))
        switch match {
        | Some(def) => def->FnDefinition.run(args, context, reducer)
        | None => REOther(showNameMatchDefinitions())->Error
        }
      }

    | None => RESymbolNotFound(fnName)->Error
    }
  }
}
