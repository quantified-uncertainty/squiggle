@module("./PercentilesChart.js")
external percentilesChart: React.element = "PercentilesChart"

module Internal = {
  type props
  type makeType = props => React.element
  type dataType = { "facet": array<
    {
      "p1": float,
      "p10": float,
      "p20": float,
      "p30": float,
      "p40": float,
      "p5": float,
      "p50": float,
      "p60": float,
      "p70": float,
      "p80": float,
      "p90": float,
      "p95": float,
      "p99": float,
      "x": float,
    }>}
  @obj external makeProps: (~data: dataType, ~signalListeners: list<string>,~children:React.element, unit) => props = ""

  @module("./PercentilesChart.js")
  external make : makeType = "PercentilesChart"
}

@react.component
@module("./PercentilesChart.js")
let make = (~dists: array<(float, DistTypes.distPlus)>, ~children=React.null) => {
  let data = dists |> E.A.fmap(((x, r)) =>
    {
      "x": x,
      "p1": r |> DistPlus.T.Integral.yToX(0.01),
      "p5": r |> DistPlus.T.Integral.yToX(0.05),
      "p10": r |> DistPlus.T.Integral.yToX(0.1),
      "p20": r |> DistPlus.T.Integral.yToX(0.2),
      "p30": r |> DistPlus.T.Integral.yToX(0.3),
      "p40": r |> DistPlus.T.Integral.yToX(0.4),
      "p50": r |> DistPlus.T.Integral.yToX(0.5),
      "p60": r |> DistPlus.T.Integral.yToX(0.6),
      "p70": r |> DistPlus.T.Integral.yToX(0.7),
      "p80": r |> DistPlus.T.Integral.yToX(0.8),
      "p90": r |> DistPlus.T.Integral.yToX(0.9),
      "p95": r |> DistPlus.T.Integral.yToX(0.95),
      "p99": r |> DistPlus.T.Integral.yToX(0.99),
    }
  )
  Js.log3("Data", dists, data)
  let da = {"facet": data}
  <Internal data=da signalListeners=list{}>children</Internal>
}
