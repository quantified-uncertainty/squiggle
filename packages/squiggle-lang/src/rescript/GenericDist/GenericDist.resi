type t = GenericDist_Types.genericDist
type error = GenericDist_Types.error
type toPointSetFn = t => result<PointSetTypes.pointSetDist, error>
type toSampleSetFn = t => result<array<float>, error>
type scaleMultiplyFn = (t, float) => result<t, error>
type pointwiseAddFn = (t, t) => result<t, error>

let sampleN: (int, t) => result<array<float>, error>

let fromFloat: float => t

let toString: t => string

let normalize: t => t

let operationToFloat: (toPointSetFn, Operation.distToFloatOperation, t) => result<float, error>

let toPointSet: (int, t) => result<PointSetTypes.pointSetDist, error>

let truncate: (toPointSetFn, option<float>, option<float>, t) => result<t, error>

let algebraicCombination: (
  toPointSetFn,
  toSampleSetFn,
  GenericDist_Types.Operation.arithmeticOperation,
  t,
  t,
) => result<t, error>

let pointwiseCombination: (
  toPointSetFn,
  GenericDist_Types.Operation.arithmeticOperation,
  t,
  t,
) => result<t, error>

let pointwiseCombinationFloat: (
  toPointSetFn,
  GenericDist_Types.Operation.arithmeticOperation,
  float,
  t,
) => result<t, error>

let mixture: (scaleMultiplyFn, pointwiseAddFn, array<(t, float)>) => result<t, error>
