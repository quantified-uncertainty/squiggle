@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const PointSetDist = require('../../../Dist/PointSetDist')`)

type t = DistributionTypes.genericDist

module T = {
  type integral = PointSetTypes.continuousShape

  let mapYResult = (
    ~integralSumCacheFn: float => option<float>=_ => None,
    ~integralCacheFn: PointSetTypes.continuousShape => option<PointSetTypes.continuousShape>=_ =>
      None,
    t: t,
    fn: float => result<float, Operation.Error.t>,
  ): result<t, Operation.Error.t> => {
    %raw(`t.mapYResult(fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }
}
