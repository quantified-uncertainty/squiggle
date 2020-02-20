module Styles = {
  open Css;
  let graph = chartColor =>
    style([
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