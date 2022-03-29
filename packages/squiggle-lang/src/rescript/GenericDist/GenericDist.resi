type t = GenericDist_Types.genericDist
type error = GenericDist_Types.error
type toPointSetFn = t => result<PointSetTypes.pointSetDist, error>
type toSampleSetFn = t => result<array<float>, error>
type scaleMultiplyFn = (t, float) => result<t, error>
type pointwiseAddFn = (t, t) => result<t, error>

let sampleN: (t, int) => result<array<float>, error>

let fromFloat: float => t

let toString: t => string

let normalize: t => t

let operationToFloat: (t, toPointSetFn, Operation.distToFloatOperation) => result<float, error>

let toPointSet: (t, int) => result<PointSetTypes.pointSetDist, error>

let truncate: (t, toPointSetFn, option<float>, option<float>) => result<t, error>

let algebraicCombination: (
  t,
  toPointSetFn,
  toSampleSetFn,
  GenericDist_Types.Operation.arithmeticOperation,
  t,
) => result<t, error>

let pointwiseCombination: (
  t,
  toPointSetFn,
  GenericDist_Types.Operation.arithmeticOperation,
  t,
) => result<t, error>

let pointwiseCombinationFloat: (
  t,
  toPointSetFn,
  GenericDist_Types.Operation.arithmeticOperation,
  float,
) => result<t, error>

let mixture: (array<(t, float)>, scaleMultiplyFn, pointwiseAddFn) => result<t, error>
