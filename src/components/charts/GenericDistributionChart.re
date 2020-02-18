module Continuous = {
  [@react.component]
  let make = (~data) => {
    let (x, setX) = React.useState(() => 0.);
    let chart =
      React.useMemo1(
        () =>
          <CdfChart__Plain
            data
            color={`hex("333")}
            onHover={r => setX(_ => r)}
          />,
        [|data|],
      );
    <div>
      chart
      <table className="table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2"> {"X Point" |> ReasonReact.string} </th>
            <th className="px-4 py-2"> {"Y Pount" |> ReasonReact.string} </th>
            <th className="px-4 py-2">
              {"Y Integral to Point" |> ReasonReact.string}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="px-4 py-2 border ">
              {x |> E.Float.toString |> ReasonReact.string}
            </th>
            <th className="px-4 py-2 border ">
              {Shape.Continuous.findY(x, data)
               |> E.Float.with2DigitsPrecision
               |> ReasonReact.string}
            </th>
            <th className="px-4 py-2 border ">
              {Shape.Continuous.findY(x, Shape.XYShape.integral(data))
               |> E.Float.with2DigitsPrecision
               |> ReasonReact.string}
            </th>
          </tr>
        </tbody>
      </table>
      <div />
    </div>;
  };
};

[@react.component]
let make = (~dist) => {
  switch ((dist: option(DistributionTypes.genericDistribution))) {
  | Some({
      generationSource:
        Shape(
          Mixed({
            continuous: n,
            discrete: d,
            discreteProbabilityMassFraction: f,
          }),
        ),
    }) =>
    Js.log2("n", n);
    Js.log2("d", d);
    Js.log2("f", f);
    Js.log2("dist", dist);
    <div>
      <Continuous data={n |> Shape.Continuous.toPdf} />
      {d |> Shape.Discrete.scaleYToTotal(f) |> Shape.Discrete.render}
    </div>;
  | _ => <div />
  };
};