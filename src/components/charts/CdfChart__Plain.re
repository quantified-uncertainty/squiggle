module Styles = {
  open Css;
  let textOverlay = style([position(`absolute)]);
  let mainText = style([fontSize(`em(1.1))]);
  let secondaryText = style([fontSize(`em(0.9))]);

  let graph = chartColor =>
    style([
      position(`relative),
      selector(".x-axis", [fontSize(`px(9))]),
      selector(".x-axis .domain", [display(`none)]),
      selector(".x-axis .tick line", [display(`none)]),
      selector(".x-axis .tick text", [color(`hex("bfcad4"))]),
      selector(".chart .area-path", [SVG.fill(chartColor)]),
      selector(".lollipops-line", [SVG.stroke(`hex("bfcad4"))]),
      selector(
        ".lollipops-circle",
        [SVG.stroke(`hex("bfcad4")), SVG.fill(`hex("bfcad4"))],
      ),
      selector(".lollipops-x-axis .domain", [display(`none)]),
      selector(".lollipops-x-axis .tick line", [display(`none)]),
      selector(".lollipops-x-axis .tick text", [display(`none)]),
    ]);
};

[@react.component]
let make =
    (
      ~color=`hex("111"),
      ~discrete=?,
      ~height=200,
      ~maxX=?,
      ~minX=?,
      ~onHover: float => unit,
      ~primaryDistribution=?,
      ~scale=?,
      ~showDistributionLines=false,
      ~showDistributionYAxis=false,
      ~showVerticalLine=false,
      ~timeScale=?,
    ) => {
  <div className={Styles.graph(color)}>
    <CdfChart__Base
      ?maxX
      ?minX
      ?scale
      ?timeScale
      discrete={discrete |> E.O.fmap(d => d |> Shape.Discrete.toJs)}
      height
      marginBottom=50
      marginTop=0
      onHover
      primaryDistribution={
        primaryDistribution |> E.O.fmap(pd => pd |> Shape.XYShape.toJs)
      }
      showDistributionLines
      showDistributionYAxis
      showVerticalLine
    />
  </div>;
};