@genType type distributionError = DistributionTypes.error

@genType
let toString = (e: distributionError) => DistributionTypes.Error.toString(e)
