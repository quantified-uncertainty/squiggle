type t = PointSetTypes.pointSetDist

type scalar = float
type abstractScoreArgs<'a, 'b> = {estimate: 'a, answer: 'b, prior: option<'a>}
type scoreArgs =
  | DistEstimateDistAnswer(abstractScoreArgs<t, t>)
  | DistEstimateScalarAnswer(abstractScoreArgs<t, scalar>)
  | ScalarEstimateDistAnswer(abstractScoreArgs<scalar, t>)
  | ScalarEstimateScalarAnswer(abstractScoreArgs<scalar, scalar>)

let logFn = Js.Math.log // base e
let minusScaledLogOfQuotient = (~esti, ~answ): result<float, Operation.Error.t> => {
  let quot = esti /. answ
  quot < 0.0 ? Error(Operation.ComplexNumberError) : Ok(-.answ *. logFn(quot))
}

module WithDistAnswer = {
  // The Kullback-Leibler divergence
  let integrand = (estimateElement: float, answerElement: float): result<
    float,
    Operation.Error.t,
  > =>
    // We decided that negative infinity, not an error at answerElement = 0.0, is a desirable value.
    if answerElement == 0.0 {
      Ok(0.0)
    } else if estimateElement == 0.0 {
      Ok(infinity)
    } else {
      minusScaledLogOfQuotient(~esti=estimateElement, ~answ=answerElement)
    }

  let rec sum = (~estimate: t, ~answer: t, ~combineFn, ~integrateFn, ~toMixedFn): result<
    float,
    Operation.Error.t,
  > =>
    switch (estimate, answer) {
    | (Continuous(_), Continuous(_))
    | (Discrete(_), Discrete(_)) =>
      combineFn(integrand, estimate, answer)->E.R2.fmap(integrateFn)
    | (_, _) =>
      let esti = estimate->toMixedFn
      let answ = answer->toMixedFn
      switch (
        Mixed.T.toContinuous(esti),
        Mixed.T.toDiscrete(esti),
        Mixed.T.toContinuous(answ),
        Mixed.T.toDiscrete(answ),
      ) {
      | (
          Some(estiContinuousPart),
          Some(estiDiscretePart),
          Some(answContinuousPart),
          Some(answDiscretePart),
        ) =>
        E.R.merge(
          sum(
            ~estimate=Discrete(estiDiscretePart),
            ~answer=Discrete(answDiscretePart),
            ~combineFn,
            ~integrateFn,
            ~toMixedFn,
          ),
          sum(
            ~estimate=Continuous(estiContinuousPart),
            ~answer=Continuous(answContinuousPart),
            ~combineFn,
            ~integrateFn,
            ~toMixedFn,
          ),
        )->E.R2.fmap(((discretePart, continuousPart)) => discretePart +. continuousPart)
      | (_, _, _, _) => `unreachable state`->Operation.Other->Error
      }
    }

  let sumWithPrior = (
    ~estimate: t,
    ~answer: t,
    ~prior: t,
    ~combineFn,
    ~integrateFn,
    ~toMixedFn,
  ): result<float, Operation.Error.t> => {
    let kl1 = sum(~estimate, ~answer, ~combineFn, ~integrateFn, ~toMixedFn)
    let kl2 = sum(~estimate=prior, ~answer, ~combineFn, ~integrateFn, ~toMixedFn)
    E.R.merge(kl1, kl2)->E.R2.fmap(((kl1', kl2')) => kl1' -. kl2')
  }
}

module WithScalarAnswer = {
  let score' = (~estimatePdf: float => float, ~answer: float): result<float, Operation.Error.t> => {
    let density = answer->estimatePdf
    if density < 0.0 {
      Operation.PdfInvalidError->Error
    } else if density == 0.0 {
      infinity->Ok
    } else {
      density->logFn->(x => -.x)->Ok
    }
  }
  let scoreWithPrior' = (
    ~estimatePdf: float => float,
    ~answer: scalar,
    ~priorPdf: float => float,
  ): result<float, Operation.Error.t> => {
    let numerator = answer->estimatePdf
    let priorDensityOfAnswer = answer->priorPdf
    if numerator < 0.0 || priorDensityOfAnswer < 0.0 {
      Operation.PdfInvalidError->Error
    } else if numerator == 0.0 || priorDensityOfAnswer == 0.0 {
      infinity->Ok
    } else {
      minusScaledLogOfQuotient(~esti=numerator, ~answ=priorDensityOfAnswer)
    }
  }

  let sum = (mp: PointSetTypes.MixedPoint.t): float => mp.continuous +. mp.discrete
  let score = (~estimate: t, ~answer: scalar): result<float, Operation.Error.t> => {
    let estimatePdf = x =>
      switch estimate {
      | Continuous(esti) => Continuous.T.xToY(x, esti)->sum
      | Discrete(esti) => Discrete.T.xToY(x, esti)->sum
      | Mixed(esti) => Mixed.T.xToY(x, esti)->sum
      }

    score'(~estimatePdf, ~answer)
  }
  let scoreWithPrior = (~estimate: t, ~answer: scalar, ~prior: t): result<
    float,
    Operation.Error.t,
  > => {
    let estimatePdf = x =>
      switch estimate {
      | Continuous(esti) => Continuous.T.xToY(x, esti)->sum
      | Discrete(esti) => Discrete.T.xToY(x, esti)->sum
      | Mixed(esti) => Mixed.T.xToY(x, esti)->sum
      }
    let priorPdf = x =>
      switch prior {
      | Continuous(prio) => Continuous.T.xToY(x, prio)->sum
      | Discrete(prio) => Discrete.T.xToY(x, prio)->sum
      | Mixed(prio) => Mixed.T.xToY(x, prio)->sum
      }
    scoreWithPrior'(~estimatePdf, ~answer, ~priorPdf)
  }
}

module TwoScalars = {
  let score = (~estimate: scalar, ~answer: scalar) =>
    if answer == 0.0 {
      0.0->Ok
    } else if estimate == 0.0 {
      infinity->Ok
    } else {
      minusScaledLogOfQuotient(~esti=estimate, ~answ=answer)
    }

  let scoreWithPrior = (~estimate: float, ~answer: float, ~prior: float) =>
    if answer == 0.0 {
      0.0->Ok
    } else if estimate == 0.0 || prior == 0.0 {
      infinity->Ok
    } else {
      minusScaledLogOfQuotient(~esti=estimate /. prior, ~answ=answer)
    }
}

let twoGenericDistsToTwoPointSetDists = (~toPointSetFn, estimate, answer): result<(t, t), 'e> =>
  E.R.merge(toPointSetFn(estimate, ()), toPointSetFn(answer, ()))

let logScore = (args: scoreArgs, ~combineFn, ~integrateFn, ~toMixedFn): result<
  float,
  Operation.Error.t,
> =>
  switch args {
  | DistEstimateDistAnswer({estimate, answer, prior: None}) =>
    WithDistAnswer.sum(~estimate, ~answer, ~integrateFn, ~combineFn, ~toMixedFn)
  | DistEstimateDistAnswer({estimate, answer, prior: Some(prior)}) =>
    WithDistAnswer.sumWithPrior(~estimate, ~answer, ~prior, ~integrateFn, ~combineFn, ~toMixedFn)
  | DistEstimateScalarAnswer({estimate, answer, prior: None}) =>
    WithScalarAnswer.score(~estimate, ~answer)
  | DistEstimateScalarAnswer({estimate, answer, prior: Some(prior)}) =>
    WithScalarAnswer.scoreWithPrior(~estimate, ~answer, ~prior)
  | ScalarEstimateDistAnswer(_) => Operation.NotYetImplemented->Error
  | ScalarEstimateScalarAnswer({estimate, answer, prior: None}) =>
    TwoScalars.score(~estimate, ~answer)
  | ScalarEstimateScalarAnswer({estimate, answer, prior: Some(prior)}) =>
    TwoScalars.scoreWithPrior(~estimate, ~answer, ~prior)
  }
