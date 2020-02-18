[@bs.module "./cdfChartReact.js"]
external cdfChart: ReasonReact.reactClass = "default";

type primaryDistribution = {
  .
  "xs": array(float),
  "ys": array(float),
};

[@react.component]
let make =
    (
      ~height=?,
      ~verticalLine=?,
      ~showVerticalLine=?,
      ~marginBottom=?,
      ~marginTop=?,
      ~showDistributionLines=?,
      ~maxX=?,
      ~minX=?,
      ~onHover=(f: float) => (),
      ~primaryDistribution=?,
      ~children=[||],
    ) =>
  ReasonReact.wrapJsForReason(
    ~reactClass=cdfChart,
    ~props=
      makeProps(
        ~height?,
        ~verticalLine?,
        ~marginBottom?,
        ~marginTop?,
        ~onHover,
        ~showVerticalLine?,
        ~showDistributionLines?,
        ~maxX?,
        ~minX?,
        ~primaryDistribution?,
        (),
      ),
    children,
  )
  |> ReasonReact.element;