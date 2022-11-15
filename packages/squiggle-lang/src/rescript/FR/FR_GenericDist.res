open FunctionRegistry_Core

module Old = {
  module Helpers = {
    let arithmeticMap = r =>
      switch r {
      | "add" => #Add
      | "dotAdd" => #Add
      | "subtract" => #Subtract
      | "dotSubtract" => #Subtract
      | "divide" => #Divide
      | "log" => #Logarithm
      | "dotDivide" => #Divide
      | "pow" => #Power
      | "dotPow" => #Power
      | "multiply" => #Multiply
      | "dotMultiply" => #Multiply
      | _ => #Multiply
      }

    let catchAndConvertTwoArgsToDists = (args: array<Reducer_T.value>): option<(
      DistributionTypes.genericDist,
      DistributionTypes.genericDist,
    )> =>
      switch args {
      | [IEvDistribution(a), IEvDistribution(b)] => Some((a, b))
      | [IEvNumber(a), IEvDistribution(b)] => Some((GenericDist.fromFloat(a), b))
      | [IEvDistribution(a), IEvNumber(b)] => Some((a, GenericDist.fromFloat(b)))
      | _ => None
      }

    let toFloatFn = (
      fnCall: DistributionTypes.DistributionOperation.toFloat,
      dist: DistributionTypes.genericDist,
      ~env: GenericDist.env,
    ): option<DistributionOperation.outputType> => {
      switch GenericDist.toFloatOperation(dist, ~env, ~distToFloatOperation=fnCall) {
      | Ok(f) => f->Float->Some
      | Error(e) => e->GenDistError->Some
      }
    }

    let toDistFn = (
      fnCall: DistributionTypes.DistributionOperation.toDist,
      dist,
      ~env: GenericDist.env,
    ) => {
      DistributionOperation.run(~env, #ToDist(fnCall), dist)->Some
    }

    let twoDiststoDistFn = (direction, arithmetic, dist1, dist2, ~env: GenericDist.env) => {
      DistributionOperation.run(
        ~env,
        #ToDistCombination(direction, arithmeticMap(arithmetic), dist2),
        dist1,
      )
    }
  }

  module SymbolicConstructors = {
    let threeFloat = name =>
      switch name {
      | "triangular" => Ok(SymbolicDist.Triangular.make)
      | _ => Error("Unreachable state")
      }

    let symbolicResultToOutput = (
      symbolicResult: result<SymbolicDistTypes.symbolicDist, string>,
    ): option<DistributionOperation.outputType> =>
      switch symbolicResult {
      | Ok(r) => Some(Dist(Symbolic(r)))
      | Error(r) => Some(GenDistError(OtherError(r)))
      }
  }

  let dispatchToGenericOutput = (call: Reducer_Value.functionCall, env: GenericDist.env): option<
    DistributionOperation.outputType,
  > => {
    let (fnName, args) = call
    switch (fnName, args) {
    | ("triangular" as fnName, [IEvNumber(f1), IEvNumber(f2), IEvNumber(f3)]) =>
      SymbolicConstructors.threeFloat(fnName)
      ->E.R.bind(r => r(f1, f2, f3))
      ->SymbolicConstructors.symbolicResultToOutput
    | ("sample", [IEvDistribution(dist)]) => Helpers.toFloatFn(#Sample, dist, ~env)
    | ("sampleN", [IEvDistribution(dist), IEvNumber(n)]) =>
      Some(FloatArray(GenericDist.sampleN(dist, Belt.Int.fromFloat(n))))
    | (("mean" | "stdev" | "variance" | "min" | "max" | "mode") as op, [IEvDistribution(dist)]) => {
        let fn = switch op {
        | "mean" => #Mean
        | "stdev" => #Stdev
        | "variance" => #Variance
        | "min" => #Min
        | "max" => #Max
        | "mode" => #Mode
        | _ => #Mean
        }
        Helpers.toFloatFn(fn, dist, ~env)
      }

    | ("integralSum", [IEvDistribution(dist)]) => Helpers.toFloatFn(#IntegralSum, dist, ~env)
    | ("toString", [IEvDistribution(dist)]) => dist->GenericDist.toString->String->Some
    | ("sparkline", [IEvDistribution(dist)]) =>
      switch dist->GenericDist.toSparkline(
        ~sampleCount=env.sampleCount,
        ~bucketCount=MagicNumbers.Environment.sparklineLength,
        (),
      ) {
      | Ok(s) => String(s)
      | Error(e) => GenDistError(e)
      }->Some
    | ("sparkline", [IEvDistribution(dist), IEvNumber(n)]) =>
      // FIXME - copy-paste
      switch dist->GenericDist.toSparkline(
        ~sampleCount=env.sampleCount,
        ~bucketCount=Belt.Float.toInt(n),
        (),
      ) {
      | Ok(s) => String(s)
      | Error(e) => GenDistError(e)
      }->Some
    | ("exp", [IEvDistribution(a)]) =>
      // https://mathjs.org/docs/reference/functions/exp.html
      Helpers.twoDiststoDistFn(
        Algebraic(AsDefault),
        "pow",
        GenericDist.fromFloat(MagicNumbers.Math.e),
        a,
        ~env,
      )->Some
    | ("normalize", [IEvDistribution(dist)]) => Helpers.toDistFn(Normalize, dist, ~env)
    | ("isNormalized", [IEvDistribution(dist)]) => GenericDist.isNormalized(dist)->Bool->Some
    | ("toPointSet", [IEvDistribution(dist)]) => Helpers.toDistFn(ToPointSet, dist, ~env)
    | ("scaleLog", [IEvDistribution(dist)]) =>
      Helpers.toDistFn(Scale(#Logarithm, MagicNumbers.Math.e), dist, ~env)
    | ("scaleLog10", [IEvDistribution(dist)]) =>
      Helpers.toDistFn(Scale(#Logarithm, 10.0), dist, ~env)
    | ("scaleLog", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toDistFn(Scale(#Logarithm, float), dist, ~env)
    | ("scaleLogWithThreshold", [IEvDistribution(dist), IEvNumber(base), IEvNumber(eps)]) =>
      Helpers.toDistFn(Scale(#LogarithmWithThreshold(eps), base), dist, ~env)
    | ("scaleMultiply", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toDistFn(Scale(#Multiply, float), dist, ~env)
    | ("scalePow", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toDistFn(Scale(#Power, float), dist, ~env)
    | ("scaleExp", [IEvDistribution(dist)]) =>
      Helpers.toDistFn(Scale(#Power, MagicNumbers.Math.e), dist, ~env)
    | ("cdf", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toFloatFn(#Cdf(float), dist, ~env)
    | ("pdf", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toFloatFn(#Pdf(float), dist, ~env)
    | ("inv", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toFloatFn(#Inv(float), dist, ~env)
    | ("quantile", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toFloatFn(#Inv(float), dist, ~env)
    | ("inspect", [IEvDistribution(dist)]) => Helpers.toDistFn(Inspect, dist, ~env)
    | ("truncateLeft", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toDistFn(Truncate(Some(float), None), dist, ~env)
    | ("truncateRight", [IEvDistribution(dist), IEvNumber(float)]) =>
      Helpers.toDistFn(Truncate(None, Some(float)), dist, ~env)
    | ("truncate", [IEvDistribution(dist), IEvNumber(float1), IEvNumber(float2)]) =>
      Helpers.toDistFn(Truncate(Some(float1), Some(float2)), dist, ~env)
    | ("log", [IEvDistribution(a)]) =>
      Helpers.twoDiststoDistFn(
        Algebraic(AsDefault),
        "log",
        a,
        GenericDist.fromFloat(MagicNumbers.Math.e),
        ~env,
      )->Some
    | ("log10", [IEvDistribution(a)]) =>
      Helpers.twoDiststoDistFn(
        Algebraic(AsDefault),
        "log",
        a,
        GenericDist.fromFloat(10.0),
        ~env,
      )->Some
    | ("unaryMinus", [IEvDistribution(a)]) =>
      Helpers.twoDiststoDistFn(
        Algebraic(AsDefault),
        "multiply",
        a,
        GenericDist.fromFloat(-1.0),
        ~env,
      )->Some
    | (
        ("add" | "multiply" | "subtract" | "divide" | "pow" | "log") as arithmetic,
        [_, _] as args,
      ) =>
      Helpers.catchAndConvertTwoArgsToDists(args)->E.O.fmap(((fst, snd)) =>
        Helpers.twoDiststoDistFn(Algebraic(AsDefault), arithmetic, fst, snd, ~env)
      )
    | (
        ("dotAdd"
        | "dotMultiply"
        | "dotSubtract"
        | "dotDivide"
        | "dotPow") as arithmetic,
        [_, _] as args,
      ) =>
      Helpers.catchAndConvertTwoArgsToDists(args)->E.O.fmap(((fst, snd)) =>
        Helpers.twoDiststoDistFn(Pointwise, arithmetic, fst, snd, ~env)
      )
    | ("dotExp", [IEvDistribution(a)]) =>
      Helpers.twoDiststoDistFn(
        Pointwise,
        "dotPow",
        GenericDist.fromFloat(MagicNumbers.Math.e),
        a,
        ~env,
      )->Some
    | _ => None
    }
  }

  let genericOutputToReducerValue = (o: DistributionOperation.outputType): result<
    Reducer_T.value,
    SqError.Message.t,
  > =>
    switch o {
    | Dist(d) => Ok(Reducer_T.IEvDistribution(d))
    | Float(d) => Ok(IEvNumber(d))
    | String(d) => Ok(IEvString(d))
    | Bool(d) => Ok(IEvBool(d))
    | FloatArray(d) => Ok(IEvArray(d->E.A.fmap(r => Reducer_T.IEvNumber(r))))
    | GenDistError(err) => Error(REDistributionError(err))
    }

  let dispatch = (call: Reducer_Value.functionCall, environment) =>
    switch dispatchToGenericOutput(call, environment) {
    | Some(o) => genericOutputToReducerValue(o)
    | None =>
      SqError.Message.REOther(
        "Internal error in FR_GenericDist implementation",
      )->SqError.Message.throw
    }
}

let makeProxyFn = (name: string, inputs: array<frType>) => {
  Function.make(
    ~name,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~definitions=[
      FnDefinition.make(
        ~name,
        ~inputs,
        ~run=(inputs, context, _) => Old.dispatch((name, inputs), context.environment),
        (),
      ),
    ],
    (),
  )
}

let makeOperationFns = (): array<function> => {
  let ops = [
    "add",
    "multiply",
    "subtract",
    "divide",
    "pow",
    "log",
    "dotAdd",
    "dotMultiply",
    "dotSubtract",
    "dotDivide",
    "dotPow",
  ]
  let twoArgTypes = [
    // can't use numeric+numeric, since number+number should be delegated to builtin arithmetics
    [FRTypeDist, FRTypeNumber],
    [FRTypeNumber, FRTypeDist],
    [FRTypeDist, FRTypeDist],
  ]

  ops->E.A.fmap(op => twoArgTypes->E.A.fmap(types => makeProxyFn(op, types)))->E.A.concatMany
}

// TODO - duplicates the switch above, should rewrite with standard FR APIs
let library = E.A.concatMany([
  [
    makeProxyFn("triangular", [FRTypeNumber, FRTypeNumber, FRTypeNumber]),
    makeProxyFn("sample", [FRTypeDist]),
    makeProxyFn("sampleN", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("mean", [FRTypeDist]),
    makeProxyFn("stdev", [FRTypeDist]),
    makeProxyFn("variance", [FRTypeDist]),
    makeProxyFn("min", [FRTypeDist]),
    makeProxyFn("max", [FRTypeDist]),
    makeProxyFn("mode", [FRTypeDist]),
    makeProxyFn("integralSum", [FRTypeDist]),
    makeProxyFn("toString", [FRTypeDist]),
    makeProxyFn("sparkline", [FRTypeDist]),
    makeProxyFn("sparkline", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("exp", [FRTypeDist]),
    makeProxyFn("normalize", [FRTypeDist]),
    makeProxyFn("isNormalized", [FRTypeDist]),
    makeProxyFn("toPointSet", [FRTypeDist]),
    makeProxyFn("scaleLog", [FRTypeDist]),
    makeProxyFn("scaleLog10", [FRTypeDist]),
    makeProxyFn("scaleLog", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("scaleLogWithThreshold", [FRTypeDist, FRTypeNumber, FRTypeNumber]),
    makeProxyFn("scaleMultiply", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("scalePow", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("scaleExp", [FRTypeDist]),
    makeProxyFn("cdf", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("pdf", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("inv", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("quantile", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("inspect", [FRTypeDist]),
    makeProxyFn("truncateLeft", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("truncateRight", [FRTypeDist, FRTypeNumber]),
    makeProxyFn("truncate", [FRTypeDist, FRTypeNumber, FRTypeNumber]),
    makeProxyFn("log", [FRTypeDist]),
    makeProxyFn("log10", [FRTypeDist]),
    makeProxyFn("unaryMinus", [FRTypeDist]),
    makeProxyFn("dotExp", [FRTypeDist]),
  ],
  makeOperationFns(),
])

module Mixture = {
  let raiseArgumentError = (message: string) =>
    message->ArgumentError->REDistributionError->SqError.Message.throw

  let parseNumber = (args: Reducer_T.value): float =>
    switch args {
    | IEvNumber(x) => x
    | _ => raiseArgumentError("Not a number")
    }

  let parseNumberArray = (ags: array<Reducer_T.value>): array<float> => E.A.fmap(ags, parseNumber)

  let parseDist = (args: Reducer_T.value): DistributionTypes.genericDist =>
    switch args {
    | IEvDistribution(x) => x
    | IEvNumber(x) => GenericDist.fromFloat(x)
    | _ => raiseArgumentError("Not a distribution")
    }

  let parseDistributionArray = (ags: array<Reducer_T.value>): array<
    DistributionTypes.genericDist,
  > => E.A.fmap(ags, parseDist)

  let mixtureWithGivenWeights = (
    distributions: array<DistributionTypes.genericDist>,
    weights: array<float>,
    ~env: GenericDist.env,
  ): result<DistributionTypes.genericDist, DistributionTypes.error> =>
    E.A.length(distributions) == E.A.length(weights)
      ? GenericDist.mixture(E.A.zip(distributions, weights), ~env)
      : Error(
          ArgumentError("Error, mixture call has different number of distributions and weights"),
        )

  let mixtureWithDefaultWeights = (
    distributions: array<DistributionTypes.genericDist>,
    ~env: GenericDist.env,
  ) => {
    let length = E.A.length(distributions)
    let weights = Belt.Array.make(length, 1.0 /. Belt.Int.toFloat(length))
    mixtureWithGivenWeights(distributions, weights, ~env)
  }

  let mixture = (args: array<Reducer_T.value>, ~env: GenericDist.env) => {
    switch args {
    | [IEvArray(distributions)] =>
      parseDistributionArray(distributions)->mixtureWithDefaultWeights(~env)
    | [IEvArray(distributions), IEvArray(weights)] => {
        let distrs = parseDistributionArray(distributions)
        let wghts = parseNumberArray(weights)
        mixtureWithGivenWeights(distrs, wghts, ~env)
      }

    | _ =>
      switch E.A.last(args) {
      | Some(IEvArray(b)) => {
          let weights = parseNumberArray(b)
          let distributions = parseDistributionArray(
            E.A.slice(args, ~offset=0, ~len=E.A.length(args) - 1),
          )
          mixtureWithGivenWeights(distributions, weights, ~env)
        }

      | Some(IEvNumber(_))
      | Some(IEvDistribution(_)) =>
        parseDistributionArray(args)->mixtureWithDefaultWeights(~env)
      | _ => raiseArgumentError("Last argument of mx must be array or distribution")
      }
    }
  }
}

// FIXME - impossible to implement with FR due to arbitrary parameters length
let mxLambda = Reducer_Lambda.makeFFILambda("mx", (inputs, context, _) => {
  switch Mixture.mixture(inputs, ~env=context.environment) {
  | Ok(value) => IEvDistribution(value)
  | Error(e) => e->REDistributionError->SqError.Message.throw
  }
})
