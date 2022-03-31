module ExpressionValue = ReducerInterface_ExpressionValue

type expressionValue = ExpressionValue.expressionValue

module Sample = {
  // In real life real libraries should be somewhere else
  /*
    For an example of mapping polymorphic custom functions. To be deleted after real integration
 */
  let customAdd = (a: float, b: float): float => {a +. b}
}

module Dist = {
  let env: GenericDist_GenericOperation.env = {
    sampleCount: 1000,
    xyPointLength: 1000,
  }

  let {toDistR, toFloatR} = module(GenericDist_GenericOperation.Output)
  let runGenericOperation = GenericDist_GenericOperation.run(~env)

  let genericDistReturnToEvReturn = x =>
    switch x {
    | Ok(thing) => Ok(ReducerInterface_ExpressionValue.EvDist(thing))
    | Error(err) => Error(Reducer_ErrorValue.RETodo("")) // TODO:
    }

  let numberReturnToEvReturn = x =>
    switch x {
    | Ok(n) => Ok(ReducerInterface_ExpressionValue.EvNumber(n))
    | Error(err) => Error(Reducer_ErrorValue.RETodo("")) // TODO:
    }

  let arithmeticMap = r =>
    switch r {
    | "add" => #Add
    | "dotAdd" => #Add
    | "subtract" => #Subtract
    | "dotSubtract" => #Subtract
    | "divide" => #Divide
    | "logarithm" => #Divide
    | "dotDivide" => #Divide
    | "exponentiate" => #Exponentiate
    | "dotExponentiate" => #Exponentiate
    | "multiply" => #Multiply
    | "dotMultiply" => #Multiply
    | "dotLogarithm" => #Divide
    | _ => #Multiply
    }

  let catchAndConvertTwoArgsToDists = (args: array<expressionValue>): option<(
    GenericDist_Types.genericDist,
    GenericDist_Types.genericDist,
  )> => {
    switch args {
    | [EvDist(a), EvDist(b)] => Some((a, b))
    | [EvNumber(a), EvDist(b)] => Some((GenericDist.fromFloat(a), b))
    | [EvDist(a), EvNumber(b)] => Some((a, GenericDist.fromFloat(b)))
    | _ => None
    }
  }

  let toFloatFn = (fnCall: GenericDist_Types.Operation.toFloat, dist) => {
    FromDist(GenericDist_Types.Operation.ToFloat(fnCall), dist)
    ->runGenericOperation
    ->toFloatR
    ->numberReturnToEvReturn
    ->Some
  }

  let toDistFn = (fnCall: GenericDist_Types.Operation.toDist, dist) => {
    FromDist(GenericDist_Types.Operation.ToDist(fnCall), dist)
    ->runGenericOperation
    ->toDistR
    ->genericDistReturnToEvReturn
    ->Some
  }

  let twoDiststoDistFn = (direction, arithmetic, dist1, dist2) => {
    FromDist(
      GenericDist_Types.Operation.ToDistCombination(
        direction,
        arithmeticMap(arithmetic),
        #Dist(dist2),
      ),
      dist1,
    )
    ->runGenericOperation
    ->toDistR
    ->genericDistReturnToEvReturn
  }

  let dispatch = (call: ExpressionValue.functionCall): option<result<expressionValue, 'e>> => {
    let (fnName, args) = call
    switch (fnName, args) {
    | ("cdf", [EvDist(dist), EvNumber(float)]) => toFloatFn(#Cdf(float), dist)
    | ("pdf", [EvDist(dist), EvNumber(float)]) => toFloatFn(#Pdf(float), dist)
    | ("inv", [EvDist(dist), EvNumber(float)]) => toFloatFn(#Inv(float), dist)
    | ("mean", [EvDist(dist)]) => toFloatFn(#Mean, dist)
    | ("normalize", [EvDist(dist)]) => toDistFn(Normalize, dist)
    | ("toPointSet", [EvDist(dist)]) => toDistFn(ToPointSet, dist)
    | ("toSampleSet", [EvDist(dist), EvNumber(float)]) =>
      toDistFn(ToSampleSet(Belt.Int.fromFloat(float)), dist)
    | ("truncateLeft", [EvDist(dist), EvNumber(float)]) =>
      toDistFn(Truncate(Some(float), None), dist)
    | ("truncateRight", [EvDist(dist), EvNumber(float)]) =>
      toDistFn(Truncate(None, Some(float)), dist)
    | ("truncate", [EvDist(dist), EvNumber(float1), EvNumber(float2)]) =>
      toDistFn(Truncate(Some(float1), Some(float2)), dist)
    | ("sample", [EvDist(dist)]) => toFloatFn(#Sample, dist)
    | (
        ("add" | "multiply" | "subtract" | "divide" | "exponentiate") as arithmetic,
        [a, b] as args,
      ) =>
      catchAndConvertTwoArgsToDists(args) |> E.O.fmap(((fst, snd)) =>
        twoDiststoDistFn(Algebraic, arithmetic, fst, snd)
      )
    | (
        ("dotAdd" | "dotSubtract" | "dotDivide" | "dotExponentiate" | "dotMultiply") as arithmetic,
        [a, b] as args,
      ) =>
      catchAndConvertTwoArgsToDists(args) |> E.O.fmap(((fst, snd)) =>
        twoDiststoDistFn(Pointwise, arithmetic, fst, snd)
      )
    | _ => None
    }
  }
}

/*
  Map external calls of Reducer
*/

let dispatch = (call: ExpressionValue.functionCall, chain): result<expressionValue, 'e> =>
  Dist.dispatch(call) |> E.O.default(chain(call))
/*
If your dispatch is too big you can divide it into smaller dispatches and pass the call so that it gets called finally.

The final chain(call) invokes the builtin default functions of the interpreter.

Via chain(call), all MathJs operators and functions are available for string, number , boolean, array and record
 .e.g + - / * > >= < <= == /= not and or sin cos log ln concat, etc.

// See https://mathjs.org/docs/expressions/syntax.html
// See https://mathjs.org/docs/reference/functions.html

Remember from the users point of view, there are no different modules:
// "doSth( constructorType1 )"
// "doSth( constructorType2 )"
doSth gets dispatched to the correct module because of the type signature. You get function and operator abstraction for free. You don't need to combine different implementations into one type. That would be duplicating the repsonsibility of the dispatcher.
*/
