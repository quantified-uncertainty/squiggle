// Port of Sindre Sorhus' Sparkly to Rescript
// reference implementation: https://github.com/sindresorhus/sparkly
// Omitting rgb "fire" style, so no `chalk` dependency

type sparklyConfig = {
  minimum: option<float>,
  maximum: option<float>
}

let sparkly = (
  numbers: array<float>,
  ~options = {minimum: None, maximum: None}
) => {
  // if not numbers is not an array, throw typeerror "Expected an array"

  // Unlike reference impl, we assume that all numbers are finite, i.e. no NaN.
  let ticks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]// ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
  let minimum = switch options.minimum {
    | None => Js.Math.minMany_float(numbers)
    | Some(x) => x
  }
  let maximum = switch options.maximum {
    | None => Js.Math.maxMany_float(numbers)
    | Some(x) => x
  }

  // Use a high tick if data is constant and max is not equal
  let ticks = if minimum == maximum && maximum != 0.0 {
    [ticks[4]]
  } else {
    ticks
  }

  let toMapWith = (number: float) => {
    let ret = {
      let tickIndex = Js.Math.ceil_int((number /. maximum) *. Belt.Int.toFloat(Belt.Array.length(ticks))) - 1

      let tickIndex = if maximum == 0.0 || tickIndex < 0 {
        0
      } else {
        tickIndex
      }
      ticks[tickIndex]
    }
    ret
  }
  let ret = Belt.Array.map(numbers, toMapWith)
  // Belt.Array.reduce(ret, "", (x, y) => x ++ y)
  Js.Array.joinWith("", ret)
}
