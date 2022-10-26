@genType
type arg = Float({min: float, max: float}) | Date({min: Js.Date.t, max: Js.Date.t})

@genType
type declaration<'a> = {
  fn: 'a,
  args: array<arg>,
}

module ContinuousFloatArg = {
  let make = (min: float, max: float): arg => {
    Float({min, max})
  }
}

module ContinuousTimeArg = {
  let make = (min: Js.Date.t, max: Js.Date.t): arg => {
    Date({min, max})
  }
}

module Arg = {
  let toString = (arg: arg) => {
    switch arg {
    | Float({min, max}) =>
      `Float({min: ${E.Float.with2DigitsPrecision(min)}, max: ${E.Float.with2DigitsPrecision(
          max,
        )}})`
    | Date({min, max}) =>
      `Date({min: ${DateTime.Date.toString(min)}, max: ${DateTime.Date.toString(max)}})`
    }
  }
}

let make = (fn: 'a, args: array<arg>): declaration<'a> => {
  {fn, args}
}

let toString = (r: declaration<'a>, fnToString): string => {
  let args = r.args->E.A.fmap(Arg.toString)->E.A.joinWith(", ")
  return`fn: ${fnToString(r.fn)}, args: [${args}]`
}
