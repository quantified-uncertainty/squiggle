@genType
type continuousArg = Float({min: float, max: float}) | Time({min: Js.Date.t, max: Js.Date.t})
@genType
type continuousDeclaration<'a> = {fn: 'a, args: array<continuousArg>}
@genType
type relativeComparisonDeclaration<'a> = {fn: 'a, options: array<string>}
@genType
type declaration<'a> =
  Continuous(continuousDeclaration<'a>) | RelativeComparison(relativeComparisonDeclaration<'a>)

module ContinuousFloatArg = {
  let make = (min: float, max: float): continuousArg => {
    Float({min: min, max: max})
  }
}

module ContinuousTimeArg = {
  let make = (min: Js.Date.t, max: Js.Date.t): continuousArg => {
    Time({min: min, max: max})
  }
}

module ContinuousDeclaration = {
  let make = (fn: 'a, args: array<continuousArg>): declaration<'a> => {
    Continuous({fn: fn, args: args})
  }
}

module RelativeComparisonDeclaration = {
  let make = (fn: 'a, options: array<string>): declaration<'a> => {
    RelativeComparison({fn: fn, options: options})
  }
}
