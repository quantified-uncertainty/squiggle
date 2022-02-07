module JS = {
  @deriving(abstract)
  type numberPresentation = {
    value: string,
    power: option<float>,
    symbol: option<string>,
  }

  @module("./numberShower.js")
  external numberShow: (float, int) => numberPresentation = "numberShow"
}

let sup = {
  open CssJs
  style(. [ fontSize(#em(0.6)), verticalAlign(#super) ])
}

@react.component
let make = (~number, ~precision) => {
  let numberWithPresentation = JS.numberShow(number, precision)
  <span>
    {JS.valueGet(numberWithPresentation) |> React.string}
    {JS.symbolGet(numberWithPresentation) |> E.O.React.fmapOrNull(React.string)}
    {JS.powerGet(numberWithPresentation) |> E.O.React.fmapOrNull(e =>
      <span>
        {j`\\u00b710` |> React.string}
        <span style=sup> {e |> E.Float.toString |> React.string} </span>
      </span>
    )}
  </span>
}
