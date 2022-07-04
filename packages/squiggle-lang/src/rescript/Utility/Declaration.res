@genType
type arg =
  | Float({min: float, max: float})
  | Date({min: Js.Date.t, max: Js.Date.t})
  | Bool
  | String({options: array<string>})

type argType = [#Float(float) | #Date(Js.Date.t) | #Bool(bool) | #String(array<string>)]

@genType
type declaration<'a> = {
  fn: 'a,
  args: array<arg>,
}

module Float = {
  let range = (min, max, i) => E.A.Floats.range(min, max, i)
  let random = (min, max) => min +. Js.Math.random() *. (max -. min)
}

module Date = {
  let range = (min: Js.Date.t, max: Js.Date.t, i) => E.JsDate.range(min, max, i)
  let random = (min: Js.Date.t, max: Js.Date.t) =>
    Float.random(Js.Date.valueOf(min), Js.Date.valueOf(max))->Js.Date.fromFloat
}

module Bool = {
  let range = [true, false]
  let random = () => E.Int.random(~min=0, ~max=1) |> E.A.unsafe_get([true, false])
}

module String = {
  let range = (options: array<string>, i) => {
    if E.A.length(options) < i {
      options
    } else {
      Belt.Array.makeBy(i, _ => E.Int.random(~min=0, ~max=E.A.length(options) - 1))
      ->E.A.uniq
      ->E.A2.fmap(E.A.unsafe_get(options))
    }
  }

  let random = (options: array<string>) => {
    let i = E.Int.random(~min=0, ~max=E.A.length(options) - 1)
    E.A.unsafe_get(options, i)
  }
}

module Arg = {
  let range = (arg: arg, i) =>
    switch arg {
    | Float({min, max}) => Float.range(min, max, i)->E.A2.fmap(r => #Float(r))
    | Date({min, max}) => Date.range(min, max, i)->E.A2.fmap(r => #Date(r))
    | Bool => Bool.range->E.A2.fmap(r => #Bool(r))
    | String({options}) => String.range(options, i)->E.A2.fmap(r => #String(r))
    }

  let random = (arg: arg) =>
    switch arg {
    | Float({min, max}) => #Float(Float.random(min, max))
    | Date({min, max}) => #Date(Date.random(min, max))
    | Bool => #Bool(Bool.random())
    | String({options}) => #String(String.random(options))
    }

  let possibleValueNumber = (arg: arg) =>
    switch arg {
    | Float(_) => infinity
    | Date(_) => infinity
    | Bool => 2.0
    | String({options}) => E.A.length(options)->E.Int.toFloat
    }

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

let meshFromCount = (args: array<arg>, total) => {
  let length = E.A.length(args)
  let averageCount =
    Js.Math.pow_float(
      ~base=E.Int.toFloat(total),
      ~exp=1.0 /. E.Int.toFloat(length),
    )->Js.Math.floor_int
  args->E.A2.fmap(Arg.range(_, averageCount))->E.A.cartesianProductMany
}

let randomFromCount = (args: array<arg>, total) => {
  let randomItem = () => args |> E.A.fmap(Arg.random)
  Belt.Array.makeBy(total, _ => randomItem())
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

let toString = (r: declaration<'a>, fnToString): string => {
  let args = r.args->E.A2.fmap(Arg.toString) |> E.A.joinWith(", ")
  return`fn: ${fnToString(r.fn)}, args: [${args}]`
}
