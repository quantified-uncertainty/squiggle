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

let toFloatOperation: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~distToFloatOperation: Operation.distToFloatOperation,
) => result<float, error>

let toPointSet: (
  t,
  ~xyPointLength: int,
  ~sampleCount: int,
  ~xSelection: GenericDist_Types.Operation.pointsetXSelection=?,
  unit,
) => result<PointSetTypes.pointSetDist, error>
let toSparkline: (t, ~sampleCount: int, ~buckets: int=?, unit) => result<string, error>

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
  ~arithmeticOperation: GenericDist_Types.Operation.arithmeticOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombination: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~arithmeticOperation: GenericDist_Types.Operation.arithmeticOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombinationFloat: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~arithmeticOperation: GenericDist_Types.Operation.arithmeticOperation,
  ~float: float,
) => result<t, error>

let mixture: (
  array<(t, float)>,
  ~scaleMultiplyFn: scaleMultiplyFn,
  ~pointwiseAddFn: pointwiseAddFn,
) => result<t, error>
