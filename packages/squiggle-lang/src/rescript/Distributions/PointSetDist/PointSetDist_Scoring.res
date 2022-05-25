type t = PointSetTypes.pointSetDist
type continuousShape = PointSetTypes.continuousShape
type discreteShape = PointSetTypes.discreteShape
type mixedShape = PointSetTypes.mixedShape

type scalar = float
type abstractScoreArgs<'a, 'b> = {estimate: 'a, answer: 'b, prior: option<'a>}
type scoreArgs =
  | DistEstimateDistAnswer(abstractScoreArgs<t, t>)
  | DistEstimateScalarAnswer(abstractScoreArgs<t, scalar>)
  | ScalarEstimateDistAnswer(abstractScoreArgs<scalar, t>)
  | ScalarEstimateScalarAnswer(abstractScoreArgs<scalar, scalar>)

let logFn = Js.Math.log // base e
let minusScaledLogOfQuot = (~esti, ~answ): result<float, Operation.Error.t> => {
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
      minusScaledLogOfQuot(~esti=estimateElement, ~answ=answerElement)
    }

  let sum = (~estimate: t, ~answer: t, ~combineFn, ~integrateFn) =>
    combineFn(integrand, estimate, answer)->E.R2.fmap(integrateFn)

  let sumWithPrior = (~estimate: t, ~answer: t, ~prior: t, ~combineFn, ~integrateFn): result<
    float,
    Operation.Error.t,
  > => {
    let kl1 = sum(~estimate, ~answer, ~combineFn, ~integrateFn)
    let kl2 = sum(~estimate=prior, ~answer, ~combineFn, ~integrateFn)
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
      minusScaledLogOfQuot(~esti=numerator, ~answ=priorDensityOfAnswer)
    }
  }
  let score = (~estimate: t, ~answer: scalar): result<float, Operation.Error.t> => {
    let estimatePdf = x =>
      switch estimate {
      | Continuous(esti) => XYShape.XtoY.linear(x, esti.xyShape)
      | Discrete(esti) => XYShape.XtoY.linear(x, esti.xyShape)
      | Mixed(esti) =>
        XYShape.XtoY.linear(x, esti.continuous.xyShape) +.
        XYShape.XtoY.linear(x, esti.discrete.xyShape)
      }

    score'(~estimatePdf, ~answer)
  }
  let scoreWithPrior = (~estimate: t, ~answer: scalar, ~prior: t): result<
    float,
    Operation.Error.t,
  > => {
    let estimatePdf = x =>
      switch estimate {
      | Continuous(esti) => XYShape.XtoY.linear(x, esti.xyShape)
      | Discrete(esti) => XYShape.XtoY.linear(x, esti.xyShape)
      | Mixed(esti) =>
        XYShape.XtoY.linear(x, esti.continuous.xyShape) +.
        XYShape.XtoY.linear(x, esti.discrete.xyShape)
      }
    let priorPdf = x =>
      switch prior {
      | Continuous(prio) => XYShape.XtoY.linear(x, prio.xyShape)
      | Discrete(prio) => XYShape.XtoY.linear(x, prio.xyShape)
      | Mixed(prio) =>
        XYShape.XtoY.linear(x, prio.continuous.xyShape) +.
        XYShape.XtoY.linear(x, prio.discrete.xyShape)
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
      minusScaledLogOfQuot(~esti=estimate, ~answ=answer)
    }

  let scoreWithPrior = (~estimate: float, ~answer: float, ~prior: float) =>
    if answer == 0.0 {
      0.0->Ok
    } else if estimate == 0.0 || prior == 0.0 {
      infinity->Ok
    } else {
      minusScaledLogOfQuot(~esti=estimate /. prior, ~answ=answer)
    }
}

let logScore = (args: scoreArgs, ~combineFn, ~integrateFn): result<float, Operation.Error.t> =>
  switch args {
  | DistEstimateDistAnswer({estimate, answer, prior: None}) =>
    WithDistAnswer.sum(~estimate, ~answer, ~integrateFn, ~combineFn)
  | DistEstimateDistAnswer({estimate, answer, prior: Some(prior)}) =>
    WithDistAnswer.sumWithPrior(~estimate, ~answer, ~prior, ~integrateFn, ~combineFn)
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
