let normalDist5: GenericDist_Types.genericDist = Symbolic(#Normal({mean: 5.0, stdev: 2.0}))
let normalDist10: GenericDist_Types.genericDist = Symbolic(#Normal({mean: 10.0, stdev: 2.0}))
let normalDist20: GenericDist_Types.genericDist = Symbolic(#Normal({mean: 20.0, stdev: 2.0}))
let normalDist: GenericDist_Types.genericDist = normalDist5

let betaDist: GenericDist_Types.genericDist = Symbolic(#Beta({alpha: 2.0, beta: 5.0}))
let lognormalDist: GenericDist_Types.genericDist = Symbolic(#Lognormal({mu: 0.0, sigma: 1.0}))
let cauchyDist: GenericDist_Types.genericDist = Symbolic(#Cauchy({local: 1.0, scale: 1.0}))
let triangularDist: GenericDist_Types.genericDist = Symbolic(#Triangular({low: 1.0, medium: 2.0, high: 3.0}))
let exponentialDist: GenericDist_Types.genericDist = Symbolic(#Exponential({rate: 2.0}))
let uniformDist: GenericDist_Types.genericDist = Symbolic(#Uniform({low: 9.0, high: 10.0}))
