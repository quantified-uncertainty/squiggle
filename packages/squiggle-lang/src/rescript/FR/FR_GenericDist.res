open FunctionRegistry_Core

module Helpers = {
  let makeFn = (
    name: string,
    inputs: array<frType>,
    fn: (array<Reducer_T.value>, Env.env) => result<Reducer_T.value, errorMessage>,
  ) => {
    Function.make(
      ~name,
      ~nameSpace="",
      ~requiresNamespace=false,
      ~definitions=[
        FnDefinition.make(
          ~name,
          ~inputs,
          ~run=(inputs, context, _) => fn(inputs, context.environment),
          (),
        ),
      ],
      (),
    )
  }

  let unpackDist = (args: array<Reducer_T.value>) => {
    switch args {
    | [IEvDistribution(d)] => d
    | _ => FunctionRegistry_Helpers.impossibleError->SqError.Message.throw
    }
  }

  let unpackDistAndFloat = (args: array<Reducer_T.value>) => {
    switch args {
    | [IEvDistribution(dist), IEvNumber(float)] => (dist, float)
    | _ => FunctionRegistry_Helpers.impossibleError->SqError.Message.throw
    }
  }

  let packAny = (constructor: 'a => Reducer_T.value, r: result<'a, GenericDist.error>): result<
    Reducer_T.value,
    errorMessage,
  > => {
    switch r {
    | Ok(f) => f->constructor->Ok
    | Error(e) => e->REDistributionError->Error
    }
  }

  let packFloat = packAny(v => IEvNumber(v))
  let packDist = packAny(v => IEvDistribution(v))
  let packBool = packAny(v => IEvBool(v))
  let packString = packAny(v => IEvString(v))

  let makeDistToFloatFn = (name, fn) =>
    makeFn(name, [FRTypeDist], (inputs, env) => inputs->unpackDist->fn(~env)->packFloat)

  let makeDistToDistFn = (
    name,
    fn: (GenericDist.t, ~env: Env.env) => result<GenericDist.t, GenericDist.error>,
  ) => makeFn(name, [FRTypeDist], (inputs, env) => inputs->unpackDist->fn(~env)->packDist)

  let makeDistToBoolFn = (name, fn) =>
    makeFn(name, [FRTypeDist], (inputs, env) => inputs->unpackDist->fn(~env)->packBool)

  let makeDistToStringFn = (name, fn) =>
    makeFn(name, [FRTypeDist], (inputs, env) => inputs->unpackDist->fn(~env)->packString)

  let makeDistAndFloatToStringFn = (name, fn) =>
    makeFn(name, [FRTypeDist, FRTypeNumber], (inputs, env) => {
      let (dist, x) = unpackDistAndFloat(inputs)
      fn(dist, x, ~env)->packString
    })

  let makeDistAndFloatToFloatFn = (name, fn) =>
    makeFn(name, [FRTypeDist, FRTypeNumber], (inputs, env) => {
      let (dist, x) = unpackDistAndFloat(inputs)
      fn(dist, x, ~env)->packFloat
    })

  let makeDistAndFloatToDistFn = (name, fn) =>
    makeFn(name, [FRTypeDist, FRTypeNumber], (inputs, env) => {
      let (dist, x) = unpackDistAndFloat(inputs)
      fn(dist, x, ~env)->packDist
    })
}

module OperationFns = {
  module Operations = GenericDist.Operations
  type opPair = (string, Operations.operationFn)
  let algebraicOps: array<opPair> = [
    ("add", Operations.algebraicAdd),
    ("multiply", Operations.algebraicMultiply),
    ("subtract", Operations.algebraicSubtract),
    ("divide", Operations.algebraicDivide),
    ("pow", Operations.algebraicPower),
    ("log", Operations.algebraicLogarithm),
  ]
  let pointwiseOps: array<opPair> = [
    ("dotAdd", Operations.pointwiseAdd),
    ("dotMultiply", Operations.pointwiseMultiply),
    ("dotSubtract", Operations.pointwiseSubtract),
    ("dotDivide", Operations.pointwiseDivide),
    ("dotPow", Operations.pointwisePower),
  ]

  let make = (): array<function> => {
    let twoArgTypes = [
      // can't use numeric+numeric, since number+number should be delegated to builtin arithmetics
      [FRTypeDist, FRTypeNumber],
      [FRTypeNumber, FRTypeDist],
      [FRTypeDist, FRTypeDist],
    ]

    let unpackTwoDists = (args: array<Reducer_T.value>): (
      DistributionTypes.genericDist,
      DistributionTypes.genericDist,
    ) =>
      switch args {
      | [IEvDistribution(a), IEvDistribution(b)] => (a, b)
      | [IEvNumber(a), IEvDistribution(b)] => (GenericDist.fromFloat(a), b)
      | [IEvDistribution(a), IEvNumber(b)] => (a, GenericDist.fromFloat(b))
      | _ => FunctionRegistry_Helpers.impossibleError->SqError.Message.throw
      }

    let makeAlgebraicOpFn = ((name, operation): opPair, inputs: array<frType>) =>
      Helpers.makeFn(name, inputs, (args, env) => {
        let (dist1, dist2) = unpackTwoDists(args)
        operation(dist1, dist2, ~env)->Helpers.packDist
      })

    let makePointwiseFn = ((name, operation): opPair, inputs: array<frType>) =>
      Helpers.makeFn(name, inputs, (args, env) => {
        let (dist1, dist2) = unpackTwoDists(args)
        operation(dist1, dist2, ~env)->Helpers.packDist
      })

    E.A.concat(
      algebraicOps
      ->E.A.fmap(op => twoArgTypes->E.A.fmap(types => makeAlgebraicOpFn(op, types)))
      ->E.A.concatMany,
      pointwiseOps
      ->E.A.fmap(op => twoArgTypes->E.A.fmap(types => makePointwiseFn(op, types)))
      ->E.A.concatMany,
    )
  }
}

let library = E.A.concatMany([
  [
    Helpers.makeFn("triangular", [FRTypeNumber, FRTypeNumber, FRTypeNumber], (inputs, _) =>
      switch inputs {
      | [IEvNumber(f1), IEvNumber(f2), IEvNumber(f3)] =>
        switch SymbolicDist.Triangular.make(f1, f2, f3) {
        | Ok(d) => d->IEvDistribution->Ok
        | Error(e) => e->DistError.fromString->REDistributionError->Error
        }
      | _ => FunctionRegistry_Helpers.impossibleError->SqError.Message.throw
      }
    ),
    Helpers.makeDistToFloatFn("sample", (d, ~env as _) => GenericDist.sample(d)->Ok),
    Helpers.makeFn("sampleN", [FRTypeDist, FRTypeNumber], (inputs, _) => {
      let (dist, n) = inputs->Helpers.unpackDistAndFloat
      dist
      ->GenericDist.sampleN(Belt.Int.fromFloat(n))
      ->E.A.fmap(r => Reducer_T.IEvNumber(r))
      ->IEvArray
      ->Ok
    }),
    Helpers.makeDistToFloatFn("mean", (d, ~env as _) => GenericDist.mean(d)),
    Helpers.makeDistToFloatFn("stdev", GenericDist.stdev),
    Helpers.makeDistToFloatFn("variance", GenericDist.variance),
    Helpers.makeDistToFloatFn("min", (d, ~env as _) => GenericDist.min(d)),
    Helpers.makeDistToFloatFn("max", (d, ~env as _) => GenericDist.max(d)),
    Helpers.makeDistToFloatFn("mode", GenericDist.mode),
    Helpers.makeDistToFloatFn("integralSum", (d, ~env as _) => GenericDist.sample(d)->Ok),
    Helpers.makeDistToStringFn("toString", (d, ~env as _) => GenericDist.toString(d)->Ok),
    Helpers.makeDistToStringFn("sparkline", (dist, ~env) => {
      dist->GenericDist.toSparkline(~env, ~bucketCount=MagicNumbers.Environment.sparklineLength, ())
    }),
    Helpers.makeDistAndFloatToStringFn("sparkline", (dist, n, ~env) => {
      dist->GenericDist.toSparkline(~env, ~bucketCount=Belt.Float.toInt(n), ())
    }),
    Helpers.makeDistToDistFn("exp", (dist, ~env) => {
      GenericDist.Operations.algebraicPower(GenericDist.fromFloat(MagicNumbers.Math.e), dist, ~env)
    }),
    Helpers.makeDistToDistFn("normalize", (dist, ~env as _) => dist->GenericDist.normalize->Ok),
    Helpers.makeDistToBoolFn("isNormalized", (d, ~env as _) => GenericDist.isNormalized(d)->Ok),
    Helpers.makeDistToDistFn("toPointSet", (dist, ~env) => dist->GenericDist.toPointSet(~env, ())),
    Helpers.makeDistToDistFn("scaleLog", (dist, ~env) =>
      dist->GenericDist.scaleLog(MagicNumbers.Math.e, ~env)
    ),
    Helpers.makeDistToDistFn("scaleLog10", (dist, ~env) => dist->GenericDist.scaleLog(10.0, ~env)),
    Helpers.makeDistAndFloatToDistFn("scaleLog", (dist, x, ~env) =>
      dist->GenericDist.scaleLog(x, ~env)
    ),
    Helpers.makeFn("scaleLogWithThreshold", [FRTypeDist, FRTypeNumber, FRTypeNumber], (
      inputs,
      env,
    ) => {
      switch inputs {
      | [IEvDistribution(dist), IEvNumber(base), IEvNumber(eps)] =>
        dist
        ->GenericDist.pointwiseCombinationFloat(
          ~env,
          ~algebraicCombination=#LogarithmWithThreshold(eps),
          ~f=base,
        )
        ->Helpers.packDist
      | _ => FunctionRegistry_Helpers.impossibleError->SqError.Message.throw
      }
    }),
    Helpers.makeDistAndFloatToDistFn("scaleMultiply", (dist, f, ~env) =>
      dist->GenericDist.pointwiseCombinationFloat(~env, ~algebraicCombination=#Multiply, ~f)
    ),
    Helpers.makeDistAndFloatToDistFn("scalePow", (dist, f, ~env) =>
      dist->GenericDist.pointwiseCombinationFloat(~env, ~algebraicCombination=#Power, ~f)
    ),
    Helpers.makeDistToDistFn("scaleExp", (dist, ~env) =>
      dist->GenericDist.pointwiseCombinationFloat(
        ~env,
        ~algebraicCombination=#Power,
        ~f=MagicNumbers.Math.e,
      )
    ),
    Helpers.makeDistAndFloatToFloatFn("cdf", (d, x, ~env as _) => GenericDist.cdf(d, x)->Ok),
    Helpers.makeDistAndFloatToFloatFn("pdf", GenericDist.pdf),
    Helpers.makeDistAndFloatToFloatFn("inv", (d, x, ~env as _) => GenericDist.inv(d, x)->Ok),
    Helpers.makeDistAndFloatToFloatFn("quantile", (d, x, ~env as _) => GenericDist.inv(d, x)->Ok),
    Helpers.makeDistAndFloatToDistFn("truncateLeft", (dist, x, ~env) =>
      dist->GenericDist.truncate(~env, ~leftCutoff=Some(x), ())
    ),
    Helpers.makeDistAndFloatToDistFn("truncateRight", (dist, x, ~env) =>
      dist->GenericDist.truncate(~env, ~rightCutoff=Some(x), ())
    ),
    Helpers.makeFn("truncate", [FRTypeDist, FRTypeNumber, FRTypeNumber], (inputs, env) => {
      switch inputs {
      | [IEvDistribution(dist), IEvNumber(left), IEvNumber(right)] =>
        dist
        ->GenericDist.truncate(~env, ~leftCutoff=Some(left), ~rightCutoff=Some(right), ())
        ->Helpers.packDist
      | _ => FunctionRegistry_Helpers.impossibleError->SqError.Message.throw
      }
    }),
    Helpers.makeDistToDistFn("log", (dist, ~env) => {
      GenericDist.Operations.algebraicLogarithm(
        dist,
        GenericDist.fromFloat(MagicNumbers.Math.e),
        ~env,
      )
    }),
    Helpers.makeDistToDistFn("log10", (dist, ~env) => {
      GenericDist.Operations.algebraicLogarithm(dist, GenericDist.fromFloat(10.0), ~env)
    }),
    Helpers.makeDistToDistFn("unaryMinus", (dist, ~env) => {
      GenericDist.Operations.algebraicMultiply(dist, GenericDist.fromFloat(-1.0), ~env)
    }),
    Helpers.makeDistToDistFn("dotExp", (dist, ~env) => {
      GenericDist.Operations.pointwisePower(GenericDist.fromFloat(MagicNumbers.Math.e), dist, ~env)
    }),
  ],
  OperationFns.make(),
])
