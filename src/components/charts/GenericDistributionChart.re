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

let discreteScaleFactor = (p: DistributionTypes.pointsType) =>
  switch (p) {
  | Mixed(mixedShape) => Some(mixedShape.discreteProbabilityMassFraction)
  | Discrete(_) => None
  | Continuous(_) => None
  };

module Shapee = {
  [@react.component]
  let make = (~shape: DistributionTypes.pointsType, ~timeScale, ~onHover) => {
    let discreteScaleFactor = shape |> discreteScaleFactor;
    let continuous =
      continuousComponent(shape)
      |> E.O.bind(
           _,
           Shape.Continuous.scalePdf(
             ~scaleTo=
               discreteScaleFactor
               |> E.O.fmap(r => 1. -. r)
               |> E.O.default(1.0),
           ),
         );
    let discrete =
      discreteComponent(shape)
      |> E.O.fmap(
           Shape.Discrete.scaleYToTotal(
             discreteScaleFactor |> E.O.default(1.0),
           ),
         );
    let minX = {
      Shape.Any.minX(shape);
    };
    let maxX = {
      Shape.Any.maxX(shape);
    };
    <div>
      {continuous
       |> E.O.React.fmapOrNull(continuous =>
            <CdfChart__Plain
              primaryDistribution=continuous
              minX
              maxX
              ?discrete
              color={`hex("333")}
              onHover
              timeScale
            />
          )}
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
          |> DistributionTypes.shape
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