@genType type squiggleValue_Distribution = ForTS_Distribution.distribution

@genType
let toString = (v: squiggleValue_Distribution): string =>
  ReducerInterface_InternalExpressionValue.toStringDistribution(v)
