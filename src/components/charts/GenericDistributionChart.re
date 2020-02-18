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
              {Shape.Continuous.findY(
                 x,
                 Shape.XYShape.Range.integrateWithTriangles(data)
                 |> E.O.toExt(""),
               )
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

module Mixed = {
  [@react.component]
  let make = (~data: DistributionTypes.mixedShape) => {
    let (x, setX) = React.useState(() => 0.);
    let chart =
      React.useMemo1(
        () =>
          <CdfChart__Plain
            data={data.continuous}
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
              {Shape.Mixed.getYIntegral(x, data)
               |> E.O.fmap(E.Float.with2DigitsPrecision)
               |> E.O.default("")
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
    <div>
      <Continuous data=n />
      <Continuous
        data={
          n
          |> Shape.XYShape.Range.integrateWithTriangles
          |> E.O.toExt("")
          |> Shape.XYShape.scaleCdfTo
        }
      />
      <Mixed
        data={
          continuous:
            n
            |> Shape.Continuous.toCdf
            |> E.O.toExt("")
            |> Shape.XYShape.scaleCdfTo
            |> Shape.Continuous.toPdf
            |> E.O.toExt(""),
          discrete: d,
          discreteProbabilityMassFraction: f,
        }
      />
      <Continuous
        data={
          n
          |> Shape.XYShape.Range.integrateWithTriangles
          |> E.O.toExt("")
          |> Shape.XYShape.Range.derivative
          |> E.O.toExt("")
          |> Shape.XYShape.Range.integrateWithTriangles
          |> E.O.toExt("")
        }
      />
      {d |> Shape.Discrete.scaleYToTotal(f) |> Shape.Discrete.render}
    </div>
  | _ => <div />
  };
};