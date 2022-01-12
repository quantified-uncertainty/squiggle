module Styles = {
  open Css;
  let graph =
    style([
      selector(".axis", [fontSize(`px(11))]),
      selector(".domain", [display(`none)]),
      selector(".tick line", [display(`none)]),
      selector(".tick text", [color(`hex("2e4c65"))]),
      selector(".chart .area-path", [SVG.fill(`hex("7e9db7"))]),
    ]);
};

[@react.component]
let make = (~cdf: Types.Dist.t, ~minX=?, ~maxX=?, ~width=Some(400)) => {
  let pdf = cdf |> Types.Dist.toPdf;
  <div className=Styles.graph>
    <CdfChart__Base
      marginBottom=25
      ?width
      height=200
      ?maxX
      ?minX
      showVerticalLine=false
      showDistributionLines=false
      primaryDistribution={"xs": pdf.xs, "ys": pdf.ys}
      onHover={_r => ()}
    />
  </div>;
};
