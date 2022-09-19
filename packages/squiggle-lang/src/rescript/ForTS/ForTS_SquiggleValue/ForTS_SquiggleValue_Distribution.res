@genType type squiggleValue_Distribution = ForTS_Distribution.distribution

@genType
let toString = (v: squiggleValue_Distribution): string =>
  Reducer_Value.toStringDistribution(v)
