@@warning("-27")
%%raw(`const PointSetDist_Scoring = require('../../../PointSetDist/PointSetDist_Scoring')`)
type pointSetDist = PointSetTypes.pointSetDist

module WithDistAnswer = {
  let sum = (~estimate: pointSetDist, ~answer: pointSetDist): result<float, Operation.Error.t> => {
    %raw(`PointSetDist_Scoring.WithDistAnswer.sum({ estimate, answer })`)
  }

  let sumWithPrior = (~estimate: pointSetDist, ~answer: pointSetDist, ~prior: pointSetDist): result<
    float,
    Operation.Error.t,
  > => {
    %raw(`PointSetDist_Scoring.WithDistAnswer.sumWithPrior({ estimate, answer, prior })`)
  }
}

module WithScalarAnswer = {
  let score = (~estimate: pointSetDist, ~answer: float): result<float, Operation.Error.t> => {
    %raw(`PointSetDist_Scoring.WithScalarAnswer.score({ estimate, answer })`)
  }
  let scoreWithPrior = (~estimate: pointSetDist, ~answer: float, ~prior: pointSetDist): result<
    float,
    Operation.Error.t,
  > => {
    %raw(`PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior({ estimate, answer, prior })`)
  }
}
