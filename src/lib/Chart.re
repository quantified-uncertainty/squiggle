module Styles = {
  open Css;
  let graph = chartColor =>
    style([
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
      ~minX=None,
      ~maxX=None,
      ~width=300,
      ~height=50,
      ~color=`hex("7e9db7"),
    ) =>
  <div className={Styles.graph(color)}>
    <ForetoldComponents.CdfChart__Base
      width=0
      height
      ?minX
      ?maxX
      marginBottom=20
      showVerticalLine=false
      showDistributionLines=false
      primaryDistribution=data
    />
  </div>;