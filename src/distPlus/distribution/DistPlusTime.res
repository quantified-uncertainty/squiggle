open DistTypes

type t = DistTypes.distPlus

let unitToJson = ({unit}: t) => unit |> DistTypes.DistributionUnit.toJson

let timeVector = ({unit}: t) =>
  switch unit {
  | TimeDistribution(timeVector) => Some(timeVector)
  | UnspecifiedDistribution => None
  }

let timeInVectorToX = (f: TimeTypes.timeInVector, t: t) => {
  let timeVector = t |> timeVector
  timeVector |> E.O.fmap(TimeTypes.RelativeTimePoint.toXValue(_, f))
}

let xToY = (f: TimeTypes.timeInVector, t: t) =>
  timeInVectorToX(f, t) |> E.O.fmap(DistPlus.T.xToY(_, t))

module Integral = {
  include DistPlus.T.Integral
  let xToY = (f: TimeTypes.timeInVector, t: t) =>
    timeInVectorToX(f, t) |> E.O.fmap(x => DistPlus.T.Integral.xToY(x, t))
}
