module Mixed = {
  [@react.component]
  let make = (~data: DistributionTypes.mixedShape, ~unit) => {
    let (x, setX) = React.useState(() => 0.);
    let timeScale = unit |> DistributionTypes.DistributionUnit.toJson;
    let chart =
      React.useMemo1(
        () =>
          <CdfChart__Plain
            primaryDistribution={data.continuous}
            discrete={data.discrete}
            color={`hex("333")}
            timeScale
            onHover={r => setX(_ => r)}
            showDistributionYAxis=true
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
              {Shape.Mixed.findYIntegral(x, data)
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

let discreteComponent = (p: DistributionTypes.pointsType) =>
  switch (p) {
  | Mixed(mixedShape) => Some(mixedShape.discrete)
  | Discrete(discreteShape) => Some(discreteShape)
  | Continuous(_) => None
  };

let continuousComponent = (p: DistributionTypes.pointsType) =>
  switch (p) {
  | Mixed(mixedShape) => Some(mixedShape.continuous)
  | Discrete(_) => None
  | Continuous(c) => Some(c)
  };

module Cont = {
  [@react.component]
  let make = (~continuous, ~onHover, ~timeScale) => {
    let chart =
      React.useMemo1(
        () =>
          <CdfChart__Plain
            primaryDistribution=continuous
            color={`hex("333")}
            onHover
            timeScale
          />,
        [|continuous|],
      );
    chart;
  };
};

module Shapee = {
  [@react.component]
  let make = (~shape: DistributionTypes.pointsType, ~timeScale, ~onHover) => {
    let continuous = continuousComponent(shape);
    let discrete = discreteComponent(shape);
    <div>
      {continuous
       |> E.O.React.fmapOrNull(continuous =>
            <Cont continuous onHover timeScale />
          )}
      {discrete
       |> E.O.React.fmapOrNull(r =>
            r |> Shape.Discrete.scaleYToTotal(0.3) |> Shape.Discrete.render
          )}
    </div>;
  };
};

module GenericDist = {
  [@react.component]
  let make = (~genericDistribution: DistributionTypes.genericDistribution) => {
    let (x, setX) = React.useState(() => 0.);
    let timeScale =
      genericDistribution.unit |> DistributionTypes.DistributionUnit.toJson;
    <div>
      {genericDistribution
       |> DistributionTypes.shape
       |> E.O.React.fmapOrNull(shape => {
            <Shapee shape timeScale onHover={r => setX(_ => r)} />
          })}
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
              {genericDistribution->GenericDistribution.yIntegral(x)
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
  switch ((dist: DistributionTypes.genericDistribution)) {
  | {generationSource: Shape(_)} =>
    <div> <GenericDist genericDistribution=dist /> </div>
  | _ => <div />
  };
};