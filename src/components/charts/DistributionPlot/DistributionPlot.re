module RawPlot = {
  [@bs.module "./distPlotReact.js"]
  external plot: ReasonReact.reactClass = "default";

  type primaryDistribution =
    option({
      .
      "xs": array(float),
      "ys": array(float),
    });

  type discrete =
    option({
      .
      "xs": array(float),
      "ys": array(float),
    });

  [@react.component]
  let make =
      (
        ~height=?,
        ~marginBottom=?,
        ~marginTop=?,
        ~maxX=?,
        ~minX=?,
        ~yMaxContinuousDomainFactor=?,
        ~yMaxDiscreteDomainFactor=?,
        ~onHover=(f: float) => (),
        ~continuous=?,
        ~discrete=?,
        ~scale=?,
        ~showDistributionLines=?,
        ~showDistributionYAxis=?,
        ~showVerticalLine=?,
        ~timeScale=?,
        ~verticalLine=?,
        ~children=[||],
      ) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=plot,
      ~props=
        makeProps(
          ~height?,
          ~marginBottom?,
          ~marginTop?,
          ~maxX?,
          ~minX?,
          ~yMaxContinuousDomainFactor?,
          ~yMaxDiscreteDomainFactor?,
          ~onHover,
          ~continuous?,
          ~discrete?,
          ~scale?,
          ~showDistributionLines?,
          ~showDistributionYAxis?,
          ~showVerticalLine?,
          ~timeScale?,
          ~verticalLine?,
          (),
        ),
      children,
    )
    |> ReasonReact.element;
};

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
      selector(".x-axis .tick text", [color(`hex("7a8998"))]),
      selector(".chart .area-path", [SVG.fill(chartColor)]),
      selector(".lollipops-line", [SVG.stroke(`hex("bfcad4"))]),
      selector(
        ".lollipops-circle",
        [SVG.stroke(`hex("bfcad4")), SVG.fill(`hex("bfcad4"))],
      ),
      selector(".lollipops-x-axis .domain", [display(`none)]),
      selector(".lollipops-x-axis .tick line", [display(`none)]),
      selector(".lollipops-x-axis .tick text", [display(`none)]),
      selector(
        ".lollipop-tooltip",
        [
          position(`absolute),
          textAlign(`center),
          padding(px(2)),
          backgroundColor(hex("bfcad4")),
          borderRadius(px(3)),
        ],
      ),
      selector(
        ".lollipops-circle-mouseover",
        [SVG.fill(hex("ffa500")), SVG.stroke(`hex("fff"))],
      ),
      selector(".lollipops-line-mouseover", [SVG.stroke(`hex("ffa500"))]),
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
      ~yMaxDiscreteDomainFactor=?,
      ~yMaxContinuousDomainFactor=?,
      ~onHover: float => unit,
      ~continuous=?,
      ~scale=?,
      ~showDistributionLines=false,
      ~showDistributionYAxis=false,
      ~showVerticalLine=false,
      ~timeScale=?,
    ) => {
  <div className={Styles.graph(color)}>
    <RawPlot
      ?maxX
      ?minX
      ?yMaxDiscreteDomainFactor
      ?yMaxContinuousDomainFactor
      ?scale
      ?timeScale
      discrete={discrete |> E.O.fmap(XYShape.toJs)}
      height
      marginBottom=50
      marginTop=0
      onHover
      continuous={continuous |> E.O.fmap(XYShape.toJs)}
      showDistributionLines
      showDistributionYAxis
      showVerticalLine
    />
  </div>;
};
