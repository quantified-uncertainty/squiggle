//TODO: multimodal, add interface, split up a little bit, test somehow, track performance, refactor sampleSet, refactor ASTEvaluator.res.

type error =
  | NeedsPointSetConversion
  | InputsNeedPointSetConversion
  | NotYetImplemented
  | ImpossiblePath
  | DistributionVerticalShiftIsInvalid
  | Other(string)

type genericDist = [
  | #PointSet(PointSetTypes.pointSetDist)
  | #SampleSet(array<float>)
  | #Symbolic(SymbolicDistTypes.symbolicDist)
]

module OperationType = {
  type direction = [
    | #Algebraic
    | #Pointwise
  ]

  type arithmeticOperation = [
    | #Add
    | #Multiply
    | #Subtract
    | #Divide
    | #Exponentiate
    | #Log
  ]

  let arithmeticToFn = (arithmetic: arithmeticOperation) =>
    switch arithmetic {
    | #Add => \"+."
    | #Multiply => \"*."
    | #Subtract => \"-."
    | #Exponentiate => \"**"
    | #Divide => \"/."
    | #Log => (a, b) => log(a) /. log(b)
    }

  type toFloat = [
    | #Cdf(float)
    | #Inv(float)
    | #Mean
    | #Pdf(float)
    | #Sample
  ]

  type toDist = [
    | #normalize
    | #toPointSet
    | #toSampleSet(int)
    | #truncate(option<float>, option<float>)
  ]

  type toFloatArray = [
    | #Sample(int)
  ]

  type t = [
    | #toFloat(toFloat)
    | #toDist(toDist)
    | #toDistCombination(direction, arithmeticOperation, [#Dist(genericDist) | #Float(float)])
  ]
}

type operation = OperationType.t

module T = {
  type t = genericDist
  type toPointSetFn = genericDist => result<PointSetTypes.pointSetDist, error>
  type toSampleSetFn = genericDist => result<array<float>, error>
  let sampleN = (n, t: t) => {
    switch t {
    | #PointSet(r) => Ok(PointSetDist.sampleNRendered(n, r))
    | #Symbolic(r) => Ok(SymbolicDist.T.sampleN(n, r))
    | #SampleSet(_) => Error(NotYetImplemented)
    }
  }

  let normalize = (t: t) => {
    switch t {
    | #PointSet(r) => #PointSet(PointSetDist.T.normalize(r))
    | #Symbolic(_) => t
    | #SampleSet(_) => t
    }
  }

  let toFloat = (toPointSet: toPointSetFn, fnName, t: genericDist): result<float, error> => {
    switch t {
    | #Symbolic(r) if Belt.Result.isOk(SymbolicDist.T.operate(fnName, r)) =>
      switch SymbolicDist.T.operate(fnName, r) {
      | Ok(float) => Ok(float)
      | Error(_) => Error(ImpossiblePath)
      }
    | _ =>
      switch toPointSet(t) {
      | Ok(r) => Ok(PointSetDist.operate(fnName, r))
      | Error(r) => Error(r)
      }
    }
  }

  //TODO: Refactor this bit.
  let defaultSamplingInputs: SamplingInputs.samplingInputs = {
    sampleCount: 10000,
    outputXYPoints: 10000,
    pointSetDistLength: 1000,
    kernelWidth: None,
  }

  let toPointSet = (xyPointLength, t: t): result<PointSetTypes.pointSetDist, error> => {
    switch t {
    | #PointSet(pointSet) => Ok(pointSet)
    | #Symbolic(r) => Ok(SymbolicDist.T.toPointSetDist(xyPointLength, r))
    | #SampleSet(r) => {
        let response = SampleSet.toPointSetDist(
          ~samples=r,
          ~samplingInputs=defaultSamplingInputs,
          (),
        ).pointSetDist
        switch response {
        | Some(r) => Ok(r)
        | None => Error(Other("Converting sampleSet to pointSet failed"))
        }
      }
    }
  }

  module Truncate = {
    let trySymbolicSimplification = (leftCutoff, rightCutoff, t): option<t> =>
      switch (leftCutoff, rightCutoff, t) {
      | (None, None, _) => None
      | (lc, rc, #Symbolic(#Uniform(u))) if lc < rc =>
        Some(#Symbolic(#Uniform(SymbolicDist.Uniform.truncate(lc, rc, u))))
      | _ => None
      }

    let run = (
      toPointSet: toPointSetFn,
      leftCutoff: option<float>,
      rightCutoff: option<float>,
      t: t,
    ): result<t, error> => {
      let doesNotNeedCutoff = E.O.isNone(leftCutoff) && E.O.isNone(rightCutoff)
      if doesNotNeedCutoff {
        Ok(t)
      } else {
        switch trySymbolicSimplification(leftCutoff, rightCutoff, t) {
        | Some(r) => Ok(r)
        | None =>
          toPointSet(t) |> E.R.fmap(t =>
            #PointSet(PointSetDist.T.truncate(leftCutoff, rightCutoff, t))
          )
        }
      }
    }
  }

  /* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution. */
  module AlgebraicCombination = {
    let tryAnalyticalSimplification = (
      operation: OperationType.arithmeticOperation,
      t1: t,
      t2: t,
    ): option<result<SymbolicDistTypes.symbolicDist, string>> =>
      switch (operation, t1, t2) {
      | (operation, #Symbolic(d1), #Symbolic(d2)) =>
        switch SymbolicDist.T.tryAnalyticalSimplification(d1, d2, operation) {
        | #AnalyticalSolution(symbolicDist) => Some(Ok(symbolicDist))
        | #Error(er) => Some(Error(er))
        | #NoSolution => None
        }
      | _ => None
      }

    let runConvolution = (
      toPointSet: toPointSetFn,
      operation: OperationType.arithmeticOperation,
      t1: t,
      t2: t,
    ) =>
      E.R.merge(toPointSet(t1), toPointSet(t2)) |> E.R.fmap(((a, b)) =>
        PointSetDist.combineAlgebraically(operation, a, b)
      )

    let runMonteCarlo = (
      toSampleSet: toSampleSetFn,
      operation: OperationType.arithmeticOperation,
      t1: t,
      t2: t,
    ) => {
      E.R.merge(toSampleSet(t1), toSampleSet(t2)) |> E.R.fmap(((a, b)) => {
        Belt.Array.zip(a, b) |> E.A.fmap(((a, b)) => Operation.Algebraic.toFn(operation, a, b))
      })
    }

    //I'm (Ozzie) really just guessing here, very little idea what's best
    let expectedConvolutionCost: t => int = x =>
      switch x {
      | #Symbolic(#Float(_)) => 1
      | #Symbolic(_) => 1000
      | #PointSet(Discrete(m)) => m.xyShape |> XYShape.T.length
      | #PointSet(Mixed(_)) => 1000
      | #PointSet(Continuous(_)) => 1000
      | _ => 1000
      }

    let chooseConvolutionOrMonteCarlo = (t2: t, t1: t) =>
      expectedConvolutionCost(t1) * expectedConvolutionCost(t2) > 10000
        ? #CalculateWithMonteCarlo
        : #CalculateWithConvolution

    let run = (
      toPointSet: toPointSetFn,
      toSampleSet: toSampleSetFn,
      algebraicOp,
      t1: t,
      t2: t,
    ): result<t, error> => {
      switch tryAnalyticalSimplification(algebraicOp, t1, t2) {
      | Some(Ok(symbolicDist)) => Ok(#Symbolic(symbolicDist))
      | Some(Error(e)) => Error(Other(e))
      | None =>
        switch chooseConvolutionOrMonteCarlo(t1, t2) {
        | #CalculateWithMonteCarlo =>
          runMonteCarlo(toSampleSet, algebraicOp, t1, t2) |> E.R.fmap(r => #SampleSet(r))
        | #CalculateWithConvolution =>
          runConvolution(toPointSet, algebraicOp, t1, t2) |> E.R.fmap(r => #PointSet(r))
        }
      }
    }
  }

  //TODO: Add faster pointwiseCombine fn
  let pointwiseCombination = (toPointSet: toPointSetFn, operation, t2: t, t1: t): result<
    t,
    error,
  > => {
    E.R.merge(toPointSet(t1), toPointSet(t2))
    |> E.R.fmap(((t1, t2)) =>
      PointSetDist.combinePointwise(OperationType.arithmeticToFn(operation), t1, t2)
    )
    |> E.R.fmap(r => #PointSet(r))
  }

  let pointwiseCombinationFloat = (
    toPointSet: toPointSetFn,
    operation: OperationType.arithmeticOperation,
    f: float,
    t: t,
  ): result<t, error> => {
    switch operation {
    | #Add | #Subtract => Error(DistributionVerticalShiftIsInvalid)
    | (#Multiply | #Divide | #Exponentiate | #Log) as operation =>
      toPointSet(t) |> E.R.fmap(t => {
        //TODO: Move to PointSet codebase
        let fn = (secondary, main) => Operation.Scale.toFn(operation, main, secondary)
        let integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(operation)
        let integralCacheFn = Operation.Scale.toIntegralCacheFn(operation)
        PointSetDist.T.mapY(
          ~integralSumCacheFn=integralSumCacheFn(f),
          ~integralCacheFn=integralCacheFn(f),
          ~fn=fn(f),
          t,
        )
      })
    } |> E.R.fmap(r => #PointSet(r))
  }
}

module OmniRunner = {
  type params = {
    sampleCount: int,
    xyPointLength: int,
  }

  let genericParams = {
    sampleCount: 1000,
    xyPointLength: 1000,
  }
  type wrapped = (genericDist, params)

  let wrapWithParams = (g: genericDist, f: params): wrapped => (g, f)
  type outputType = [
    | #Dist(genericDist)
    | #Error(error)
    | #Float(float)
  ]

  let fromResult = (r: result<outputType, error>): outputType =>
    switch r {
    | Ok(o) => o
    | Error(e) => #Error(e)
    }

  let rec run = (wrapped: wrapped, fnName: operation): outputType => {
    let (value, {sampleCount, xyPointLength} as extra) = wrapped
    let reCall = (~value=value, ~extra=extra, ~fnName=fnName, ()) => {
      run((value, extra), fnName)
    }
    let toPointSet = r => {
      switch reCall(~value=r, ~fnName=#toDist(#toPointSet), ()) {
      | #Dist(#PointSet(p)) => Ok(p)
      | #Error(r) => Error(r)
      | _ => Error(ImpossiblePath)
      }
    }
    let toSampleSet = r => {
      switch reCall(~value=r, ~fnName=#toDist(#toSampleSet(sampleCount)), ()) {
      | #Dist(#SampleSet(p)) => Ok(p)
      | #Error(r) => Error(r)
      | _ => Error(ImpossiblePath)
      }
    }
    switch fnName {
    // | (#toFloat(n), v) => toFloat(toPointSet, v, n)
    | #toFloat(fnName) =>
      T.toFloat(toPointSet, fnName, value) |> E.R.fmap(r => #Float(r)) |> fromResult
    | #toDist(#normalize) => value |> T.normalize |> (r => #Dist(r))
    | #toDist(#truncate(left, right)) =>
      value |> T.Truncate.run(toPointSet, left, right) |> E.R.fmap(r => #Dist(r)) |> fromResult
    | #toDist(#toPointSet) =>
      value |> T.toPointSet(xyPointLength) |> E.R.fmap(r => #Dist(#PointSet(r))) |> fromResult
    | #toDist(#toSampleSet(n)) =>
      value |> T.sampleN(n) |> E.R.fmap(r => #Dist(#SampleSet(r))) |> fromResult
    | #toDistCombination(#Algebraic, _, #Float(_)) => #Error(NotYetImplemented)
    | #toDistCombination(#Algebraic, operation, #Dist(value2)) =>
      value
      |> T.AlgebraicCombination.run(toPointSet, toSampleSet, operation, value2)
      |> E.R.fmap(r => #Dist(r))
      |> fromResult
    | #toDistCombination(#Pointwise, operation, #Dist(value2)) =>
      value
      |> T.pointwiseCombination(toPointSet, operation, value2)
      |> E.R.fmap(r => #Dist(r))
      |> fromResult
    | #toDistCombination(#Pointwise, operation, #Float(f)) =>
      value
      |> T.pointwiseCombinationFloat(toPointSet, operation, f)
      |> E.R.fmap(r => #Dist(r))
      |> fromResult
    }
  }
}

// let applyFn = (wrapped, fnName): wrapped => {
//   let (v, extra) as result = applyFnInternal(wrapped, fnName)
//   switch v {
//   | #Error(NeedsPointSetConversion) => {
//       let convertedToPointSet = applyFnInternal(wrapped, #toDist(#toPointSet))
//       applyFnInternal(convertedToPointSet, fnName)
//     }
//   | #Error(InputsNeedPointSetConversion) => {
//       let altDist = switch fnName {
//       | #toDistCombination(p1, p2, dist) => {
//           let (newDist, _) = applyFnInternal((dist, extra), #toDist(#toPointSet))
//           applyFnInternal(wrapped, #toDistCombination(p1, p2, newDist))
//         }
//       | _ => (#Error(Other("Not needed")), extra)
//       }
//       altDist
//     }
//   | _ => result
//   }
// }

// let exampleDist: genericDist = #PointSet(
//   Discrete(Discrete.make(~integralSumCache=Some(1.0), {xs: [3.0], ys: [1.0]})),
// )

// let foo = exampleDist->wrapWithParams(genericParams)->applyFn(#toDist(#normalize))
