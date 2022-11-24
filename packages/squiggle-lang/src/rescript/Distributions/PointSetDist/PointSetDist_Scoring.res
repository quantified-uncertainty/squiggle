@@warning("-27")
%%raw(`const PointSetDist_Scoring = require('../../../PointSet/PointSetDist_Scoring')`)
type pointSetDist = PointSetTypes.pointSetDist

module WithDistAnswer = {
  let sum = (~estimate: pointSetDist, ~answer: pointSetDist): result<float, Operation.Error.t> => {
    %raw(`PointSetDist_Scoring.WithDistAnswer.sum({ estimate: estimate.pointSet, answer: answer.pointSet })`)
  }

  let sumWithPrior = (~estimate: pointSetDist, ~answer: pointSetDist, ~prior: pointSetDist): result<
    float,
    Operation.Error.t,
  > => {
    %raw(`PointSetDist_Scoring.WithDistAnswer.sumWithPrior({ estimate: estimate.pointSet, answer: answer.pointSet, prior: prior.pointSet })`)
  }
}

module WithScalarAnswer = {
  let score = (~estimate: pointSetDist, ~answer: float): result<float, Operation.Error.t> => {
    %raw(`PointSetDist_Scoring.WithScalarAnswer.score({ estimate: estimate.pointSet, answer })`)
  }
  let scoreWithPrior = (~estimate: pointSetDist, ~answer: float, ~prior: pointSetDist): result<
    float,
    Operation.Error.t,
  > => {
    %raw(`PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior({ estimate: estimate.pointSet, answer, prior: prior.pointSet })`)
  }
}
