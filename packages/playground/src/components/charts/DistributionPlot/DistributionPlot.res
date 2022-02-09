module RawPlot = {
  type primaryDistribution = option<{"xs": array<float>, "ys": array<float>}>

  type discrete = option<{"xs": array<float>, "ys": array<float>}>

  type props
  type makeType = props => React.element
  @obj external makeProps: (
    ~height: int=?,
    ~marginBottom: int=?,
    ~marginTop: int=?,
    ~maxX: float=?,
    ~minX: float=?,
    ~yMaxContinuousDomainFactor: float=?,
    ~yMaxDiscreteDomainFactor: float=?,
    ~onHover: float => (),
    ~continuous: option<{"xs": array<float>, "ys": array<float>}>=?,
    ~discrete: option<{"xs": array<float>, "ys": array<float>}>=?,
    ~xScale: string=?,
    ~yScale: string=?,
    ~showDistributionLines: bool=?,
    ~showDistributionYAxis: bool=?,
    ~showVerticalLine: bool=?,
    ~timeScale:Js.Null.t<{"unit": string, "zero": MomentRe.Moment.t}>=?,
    ~verticalLine: int=?,
    ~children: array<React.element>=?,
    unit // This unit is a quirk of the type system. Apparently it must exist to have optional arguments in a type
    ) => props = "" 


  @module("./distPlotReact.js")
  external make : makeType = "default"
}

module Styles = {
  open CssJs
  let textOverlay = style(. [position(#absolute)])
  let mainText = style(. [ fontSize(#em(1.1))])
  let secondaryText = style(. [fontSize(#em(0.9))])

  let graph = chartColor =>
    style(. [
      position(#relative),
      selector(. ".xAxis", [fontSize(#px(9))]),
      selector(. ".xAxis .domain", [ display(#none) ]),
      selector(. ".xAxis .tick line", [ display(#none) ]),
      selector(. ".xAxis .tick text", [ color(#hex("7a8998")) ]),
      selector(. ".chart .areaPath", [ SVG.fill(chartColor) ]),
      selector(. ".lollipopsLine", [ SVG.stroke(#hex("bfcad4")) ]),
      selector(. ".lollipopsCircle", [ SVG.stroke(#hex("bfcad4")), SVG.fill(#hex("bfcad4")) ]),
      selector(. ".lollipopsXAxis .domain", [ display(#none) ]),
      selector(. ".lollipopsXAxis .tick line", [ display(#none) ]),
      selector(. ".lollipopsXAxis .tick text", [ display(#none) ]),
      selector(.
        ".lollipopsTooltip",
        [ position(#absolute),
          textAlign(#center),
          padding(px(2)),
          backgroundColor(hex("bfcad4")),
          borderRadius(px(3)),
      ],
      ),
      selector(.
        ".lollipopsCircleMouseover",
        [ SVG.fill(hex("ffa500")), SVG.stroke(#hex("fff")) ],
      ),
      selector(. ".lollipopsLineMouseover", [ SVG.stroke(#hex("ffa500")) ]),
    ])
}

@react.component
let make = (
  ~color=#hex("111"),
  ~discrete=?,
  ~height=200,
  ~maxX=?,
  ~minX=?,
  ~yMaxDiscreteDomainFactor=?,
  ~yMaxContinuousDomainFactor=?,
  ~onHover: float => unit=_ => (),
  ~continuous=?,
  ~xScale=?,
  ~yScale=?,
  ~showDistributionLines=false,
  ~showDistributionYAxis=false,
  ~showVerticalLine=false,
  ~timeScale=?,
) =>
  <div className={Styles.graph(color)}>
    <RawPlot
      ?maxX
      ?minX
      ?yMaxDiscreteDomainFactor
      ?yMaxContinuousDomainFactor
      ?xScale
      ?yScale
      ?timeScale
      discrete={discrete |> E.O.fmap(ForetoldAppSquiggle.XYShape.T.toJs)}
      height
      marginBottom=50
      marginTop=0
      onHover
      continuous={continuous |> E.O.fmap(ForetoldAppSquiggle.XYShape.T.toJs)}
      showDistributionLines
      showDistributionYAxis
      showVerticalLine
    />
  </div>
