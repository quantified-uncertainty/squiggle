@genType
type arg = Float({min: float, max: float}) | Date({min: Js.Date.t, max: Js.Date.t})

@genType
type declaration<'a> = {
  fn: 'a,
  args: array<arg>,
}

module ContinuousFloatArg = {
  let make = (min: float, max: float): arg => {
    Float({min: min, max: max})
  }
}

module ContinuousTimeArg = {
  let make = (min: Js.Date.t, max: Js.Date.t): arg => {
    Date({min: min, max: max})
  }
}

let make = (fn: 'a, args: array<arg>): declaration<'a> => {
  {fn: fn, args: args}
}
