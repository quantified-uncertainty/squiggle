@@warning("-27")
%%raw(`const DistError = require('../../Dist/DistError')`)

@genType
type t

let fromString = (s: string): t => %raw(`DistError.otherError(s)`)

let toString = (err: t): string => %raw(`DistError.distErrorToString(err)`)

let resultStringToResultError: result<'a, string> => result<'a, t> = n =>
  n->E.R.errMap(r => r->fromString)

let notYetImplemented: unit => t = %raw(`DistError.notYetImplemented()`)
let unreachableError: unit => t = %raw(`DistError.unreachableError()`)
let distributionVerticalShiftIsInvalid: unit => t = %raw(`DistError.distributionVerticalShiftIsInvalid()`)

let operationError = (err: Operation.Error.t): t => %raw(`DistError.operationDistError(err)`)

let sparklineError = (err: string): t => %raw(`DistError.sparklineError(err)`)

let logarithmOfDistributionError = (err: string): t =>
  %raw(`DistError.logarithmOfDistributionError(err)`)

let requestedStrategyInvalidError = (err: string): t =>
  %raw(`DistError.requestedStrategyInvalidError(err)`)

let argumentError = (err: string): t => %raw(`DistError.argumentError(err)`)
