// Port of Sindre Sorhus' Sparkly to Rescript
// reference implementation: https://github.com/sindresorhus/sparkly
// Omitting rgb "fire" style, so no `chalk` dependency

type sparklyConfig = {
  minimum: option<float>,
  maximum: option<float>
}

let sparkly = (
  numbers: list<float>,
  ~options = {minimum: None, maximum: None}
) => {
  // if not numbers is not an array, throw typeerror "Expected an array"

  // Unlike reference impl, we assume that all numbers are finite, i.e. no NaN.
  let ticks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
  let minimum = switch options.minimum {
    | None => Js.Math.minimum(numbers)
    | Some(x) => x
  }
  let maximum = switch options.maximum {
    | None => Js.Math.maximum(numbers)
    | Some(x) => x
  }

  // Use a high tick if data is constant and max is not equal
  let ticks = if minimum == maximum && maximum != 0.0 {
    [ticks[4]]
  } else {
    ticks
  }

  let toMapWith = number => {
    let ret = if (! Js.Number.isFinite(number)) {
      " "
    } else {
      let tickIndex = Js.Math.ceil((number / maximum) * ticks.length) - 1

      let tickIndex = if maximum == 0.0 || tickIndex < 0 {
        0
      } else {
        tickIndex
      }
      ticks[tickIndex]
    }
    ret
  }
  let ret = map(toMapWith, numbers)
  Js.Array.joinWith("", ret)
}
