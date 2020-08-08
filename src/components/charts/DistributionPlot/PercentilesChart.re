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
           "p5": r |> DistPlus.T.Integral.yToX(0.05),
           "p50": r |> DistPlus.T.Integral.yToX(0.5),
           "p95": r |> DistPlus.T.Integral.yToX(0.95),
         }
       });
       Js.log3("Data", dists, data);
  <Internal data />;
};
