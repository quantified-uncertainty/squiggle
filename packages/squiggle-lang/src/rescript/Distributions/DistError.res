@@warning("-27")
%%raw(`const DistError = require('../../Dist/DistError')`)

@genType
type t

let fromString = (s: string): t => %raw(`DistError.otherError(s)`)

let toString = (err: t): string => %raw(`DistError.distErrorToString(err)`)

let argumentError = (err: string): t => %raw(`DistError.argumentError(err)`)
