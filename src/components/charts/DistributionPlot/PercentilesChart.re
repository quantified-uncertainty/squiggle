[@bs.module "./PercentilesChart.js"]
external percentilesChart: ReasonReact.reactClass = "PercentilesChart";

module Internal = {
  [@react.component]
  let make = (~data, ~children=ReasonReact.null) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=percentilesChart,
      ~props={"data": data},
      children,
    )
    |> ReasonReact.element;
};

[@react.component]
let make =
    (~dists: array((float, DistTypes.distPlus)), ~children=ReasonReact.null) => {
  let data =
    dists
    |> E.A.fmap(((x, r)) => {
         {
           "x": x,
           "p1": r |> DistPlus.T.Integral.yToX(0.01),
           "p5": r |> DistPlus.T.Integral.yToX(0.05),
           "p10": r |> DistPlus.T.Integral.yToX(0.1),
           "p20": r |> DistPlus.T.Integral.yToX(0.2),
           "p30": r |> DistPlus.T.Integral.yToX(0.3),
           "p40": r |> DistPlus.T.Integral.yToX(0.4),
           "p50": r |> DistPlus.T.Integral.yToX(0.5),
           "p60": r |> DistPlus.T.Integral.yToX(0.6),
           "p70": r |> DistPlus.T.Integral.yToX(0.7),
           "p80": r |> DistPlus.T.Integral.yToX(0.8),
           "p90": r |> DistPlus.T.Integral.yToX(0.9),
           "p95": r |> DistPlus.T.Integral.yToX(0.95),
           "p99": r |> DistPlus.T.Integral.yToX(0.99),
         }
       });
       Js.log3("Data", dists, data);
  let da = {"facet": data};
  <Internal data=da />;
};
