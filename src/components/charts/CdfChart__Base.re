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
      ~primaryDistribution=?,
      ~discrete=?,
      ~scale=?,
      ~showDistributionLines=?,
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
        ~primaryDistribution?,
        ~discrete?,
        ~scale?,
        ~showDistributionLines?,
        ~showVerticalLine?,
        ~timeScale?,
        ~verticalLine?,
        (),
      ),
    children,
  )
  |> ReasonReact.element;