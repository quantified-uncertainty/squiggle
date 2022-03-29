// Port of Sindre Sorhus' Sparkly to Rescript
// reference implementation: https://github.com/sindresorhus/sparkly
// Omitting rgb "fire" style, so no `chalk` dependency

let create = (
  numbers: array<float>,
  ~minimum=?,
  ~maximum=?,
  ()
) => {
  // Unlike reference impl, we assume that all numbers are finite, i.e. no NaN.

  let ticks = [`▁`, `▂`, `▃`, `▄`, `▅`, `▆`, `▇`, `█`]

  let minimum = E.O.default(Js.Math.minMany_float(numbers), minimum)
  let maximum = E.O.default(Js.Math.maxMany_float(numbers), maximum)

//  // Use a high tick if data is constant and max is not equal to min or zero
//  let ticks = if minimum == maximum && maximum != 0.0 {
//    [ticks[4]]
//  } else {
//    ticks
//  }

  let toHeight = (number: float) => {
    let tickIndex = Js.Math.ceil_int((number /. maximum) *. (ticks -> Belt.Array.length -> Belt.Int.toFloat)) - 1

    let tickIndex = if maximum == 0.0 || tickIndex < 0 {
        0
      } else {
        tickIndex
      }

    ticks[tickIndex]
  }
  toHeight -> E.A.fmap(numbers) -> (arr => E.A.joinWith("", arr))
}
