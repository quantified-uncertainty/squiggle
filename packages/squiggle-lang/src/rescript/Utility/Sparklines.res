// Port of Sindre Sorhus' Sparkly to Rescript
// reference implementation: https://github.com/sindresorhus/sparkly
// Omitting rgb "fire" style, so no `chalk` dependency
// Omitting: NaN handling, special consideration for constant data.

let ticks = [`▁`, `▂`, `▃`, `▄`, `▅`, `▆`, `▇`, `█`]

let _ticksLength = E.A.length(ticks)

let _heightToTickIndex = (maximum: float, v: float) => {
  let suggestedTickIndex = Js.Math.ceil_int(v /. maximum *. Belt.Int.toFloat(_ticksLength)) - 1
  max(suggestedTickIndex, 0)
}

let create = (relativeHeights: array<float>, ~maximum=?, ()) => {
  if E.A.length(relativeHeights) === 0 {
    ""
  } else {
    let maximum = maximum->E.O.default(E.A.Floats.max(relativeHeights))

    relativeHeights
    ->E.A.fmap(_heightToTickIndex(maximum))
    ->E.A.fmap(r => E.A.get(ticks, r)->E.O.toExn(""))
    ->E.A.joinWith("")
  }
}
