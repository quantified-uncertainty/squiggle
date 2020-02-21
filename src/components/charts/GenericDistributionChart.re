module Shapee = {
  [@react.component]
  let make = (~shape: DistributionTypes.shape, ~timeScale, ~onHover) => {
    let discrete = Shape.T.scaledDiscreteComponent(shape);
    let continuous = Shape.T.scaledContinuousComponent(shape);
    <div>
      <CdfChart__Plain
        minX={Shape.T.minX(shape)}
        maxX={Shape.T.maxX(shape)}
        ?discrete
        ?continuous
        color={`hex("333")}
        onHover
        timeScale
      />
      {discrete |> E.O.React.fmapOrNull(Shape.Discrete.render)}
    </div>;
  };
};

module GenericDist = {
  [@react.component]
  let make = (~genericDistribution: DistributionTypes.genericDistribution) => {
    let (x, setX) = React.useState(() => 0.);
    let timeScale =
      genericDistribution.unit |> DistributionTypes.DistributionUnit.toJson;
    let chart =
      React.useMemo1(
        () => {
          genericDistribution
          |> DistributionTypes.shapee
          |> E.O.React.fmapOrNull(shape => {
               <Shapee shape timeScale onHover={r => setX(_ => r)} />
             })
        },
        [|genericDistribution|],
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