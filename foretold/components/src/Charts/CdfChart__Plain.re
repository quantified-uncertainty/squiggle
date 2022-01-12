module Styles = {
  open Css;
  let textOverlay = style([position(`absolute)]);
  let mainText = style([fontSize(`em(1.1)), color(Settings.darkLink)]);
  let secondaryText =
    style([fontSize(`em(0.9)), color(Settings.accentBlue)]);

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
let make = (~cdf: Types.Dist.t, ~minX, ~maxX, ~color=`hex("3562AE66")) => {
  let pdf = cdf |> Types.Dist.toPdf;

  <div className={Styles.graph(color)}>
    <CdfChart__Base
      width=200
      height=30
      minX
      maxX
      marginBottom=15
      marginTop=0
      showVerticalLine=false
      showDistributionLines=false
      primaryDistribution={"xs": pdf.xs, "ys": pdf.ys}
      onHover={_r => ()}
    />
  </div>;
};
