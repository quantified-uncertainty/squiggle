[@bs.module "./PercentilesChart.js"]
external percentilesChart: ReasonReact.reactClass = "PercentilesChart";

[@react.component]
let make = (~data, ~children=ReasonReact.null) =>
  ReasonReact.wrapJsForReason(
    ~reactClass=percentilesChart,
    ~props={"data": data},
    children,
  )
  |> ReasonReact.element;