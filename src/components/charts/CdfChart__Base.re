[@bs.module "./cdfChartReact.js"]
external cdfChart: ReasonReact.reactClass = "default";

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
    ~reactClass=cdfChart,
    ~props=
      makeProps(
        ~height?,
        ~marginBottom?,
        ~marginTop?,
        ~maxX?,
        ~minX?,
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