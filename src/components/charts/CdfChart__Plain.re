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
      ~data,
      ~minX=?,
      ~maxX=?,
      ~scale=?,
      ~height=200,
      ~color=`hex("111"),
      ~onHover: float => unit,
    ) => {
  <div className={Styles.graph(color)}>
    <CdfChart__Base
      height
      ?minX
      ?maxX
      ?scale
      marginBottom=50
      marginTop=0
      onHover
      showVerticalLine=false
      showDistributionLines=false
      primaryDistribution={data |> Shape.XYShape.toJs}
    />
  </div>;
};