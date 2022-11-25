@genType type distributionError = DistError.t

@genType
let toString = (e: distributionError) => DistError.toString(e)
