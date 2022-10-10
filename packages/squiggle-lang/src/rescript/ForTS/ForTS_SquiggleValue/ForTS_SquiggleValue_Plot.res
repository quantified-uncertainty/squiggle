type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
@genType type squiggleValue_Plot = ForTS_SquiggleValue.squiggleValue_Plot //re-export recursive type
@genType type labeledDistribution = Reducer_T.labeledDistribution // use

@genType
let toString = (v: squiggleValue_Plot) => Reducer_Value.toStringPlot(v)
