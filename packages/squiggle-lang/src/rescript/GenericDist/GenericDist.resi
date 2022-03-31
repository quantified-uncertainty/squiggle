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

let operationToFloat: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~operation: Operation.distToFloatOperation,
) => result<float, error>

let toPointSet: (t, int) => result<PointSetTypes.pointSetDist, error>

let truncate: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~leftCutoff: option<float>=?,
  ~rightCutoff: option<float>=?,
  unit,
) => result<t, error>

let algebraicCombination: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~toSampleSetFn: toSampleSetFn,
  ~operation: GenericDist_Types.Operation.arithmeticOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombination: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~operation: GenericDist_Types.Operation.arithmeticOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombinationFloat: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~operation: GenericDist_Types.Operation.arithmeticOperation,
  ~float: float,
) => result<t, error>

let mixture: (
  array<(t, float)>,
  ~scaleMultiplyFn: scaleMultiplyFn,
  ~pointwiseAddFn: pointwiseAddFn,
) => result<t, error>
