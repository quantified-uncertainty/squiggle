let unpackResult = x => x->E.R.toExn("failed")

let normalDist5: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Normal.make(5., 2.)->unpackResult,
)
let normalDist10: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Normal.make(10., 2.)->unpackResult,
)
let normalDist20: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Normal.make(20., 2.)->unpackResult,
)
let normalDist: DistributionTypes.genericDist = normalDist5

let betaDist: DistributionTypes.genericDist = Symbolic(SymbolicDist.Beta.make(2., 5.)->unpackResult)
let lognormalDist: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Lognormal.make(0.0, 1.0)->unpackResult,
)
let cauchyDist: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Cauchy.make(1.0, 1.0)->unpackResult,
)
let triangularDist: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Triangular.make(1.0, 2.0, 3.0)->unpackResult,
)
let exponentialDist: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Exponential.make(2.0)->unpackResult,
)
let uniformDist: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Uniform.make(9.0, 10.0)->unpackResult,
)
let uniformDist2: DistributionTypes.genericDist = Symbolic(
  SymbolicDist.Uniform.make(8.0, 11.0)->unpackResult,
)
let floatDist: DistributionTypes.genericDist = Symbolic(SymbolicDist.Float.make(1e1)->unpackResult)

exception KlFailed
exception MixtureFailed
let float1 = 1.0
let float2 = 2.0
let float3 = 3.0
let point1 = TestHelpers.mkDelta(float1)
let point2 = TestHelpers.mkDelta(float2)
let point3 = TestHelpers.mkDelta(float3)
