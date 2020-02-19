module Mixed = {
  [@react.component]
  let make = (~data: DistributionTypes.mixedShape, ~unit) => {
    let (x, setX) = React.useState(() => 0.);
    let timeScale = unit |> DistributionTypes.DistributionUnit.toJson;
    let chart =
      React.useMemo1(
        () =>
          <CdfChart__Plain
            data={data.continuous}
            color={`hex("333")}
            timeScale
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
              {Shape.Mixed.getYIntegral(x, data)
               |> E.O.fmap(E.Float.with2DigitsPrecision)
               |> E.O.default("")
               |> ReasonReact.string}
            </th>
          </tr>
        </tbody>
      </table>
      <div />
      {data.discrete
       |> Shape.Discrete.scaleYToTotal(data.discreteProbabilityMassFraction)
       |> Shape.Discrete.render}
    </div>;
  };
};

[@react.component]
let make = (~dist) => {
  switch ((dist: option(DistributionTypes.genericDistribution))) {
  | Some({
      unit,
      generationSource:
        Shape(
          Mixed({
            continuous: n,
            discrete: d,
            discreteProbabilityMassFraction: f,
          }),
        ),
    }) =>
    <div>
      <Mixed
        unit
        data={
          continuous:
            n
            |> Shape.XYShape.Range.integrateWithTriangles
            |> E.O.toExt("")
            |> Shape.XYShape.scaleCdfTo
            |> Shape.Continuous.toPdf
            |> E.O.toExt(""),
          discrete: d,
          discreteProbabilityMassFraction: f,
        }
      />
    </div>
  | _ => <div />
  };
};