[@bs.module "./cdfChart.js"]
external cdfChart: ReasonReact.reactClass = "default";

type data = {
  .
  "xs": array(float),
  "ys": array(float),
};

[@react.component]
let make =
    (
      ~width=?,
      ~height=?,
      ~verticalLine=?,
      ~showVerticalLine=?,
      ~marginBottom=?,
      ~marginTop=?,
      ~showDistributionLines=?,
      ~maxX=?,
      ~minX=?,
      ~onHover=?,
      ~primaryDistribution=?,
      ~children=[||],
    ) =>
  ReasonReact.wrapJsForReason(
    ~reactClass=cdfChart,
    ~props=
      makeProps(
        ~width?,
        ~height?,
        ~verticalLine?,
        ~marginBottom?,
        ~marginTop?,
        ~onHover?,
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
