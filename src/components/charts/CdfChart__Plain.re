module Styles = {
  open Css;
  let textOverlay = style([position(`absolute)]);
  let mainText = style([fontSize(`em(1.1))]);
  let secondaryText = style([fontSize(`em(0.9))]);

  let graph = chartColor =>
    style([
      position(`relative),
      selector(".axis", [fontSize(`px(9))]),
      selector(".domain", [display(`none)]),
      selector(".tick line", [display(`none)]),
      selector(".tick text", [color(`hex("bfcad4"))]),
      selector(".chart .area-path", [SVG.fill(chartColor)]),
    ]);
};

[@react.component]
let make =
    (
      ~color=`hex("111"),
      ~data,
      ~height=200,
      ~maxX=?,
      ~minX=?,
      ~onHover: float => unit,
      ~scale=?,
      ~timeScale=?,
    ) => {
  <div className={Styles.graph(color)}>
    <CdfChart__Base
      ?maxX
      ?minX
      ?scale
      ?timeScale
      height
      marginBottom=50
      marginTop=0
      onHover
      primaryDistribution={data |> Shape.XYShape.toJs}
      showDistributionLines=false
      showVerticalLine=false
    />
  </div>;
};