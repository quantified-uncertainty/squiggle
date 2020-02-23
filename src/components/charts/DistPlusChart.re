module DistPlusChart = {
  [@react.component]
  let make = (~distPlus: DistributionTypes.distPlus, ~onHover) => {
    open DistFunctor.DistPlus;
    let discrete = distPlus |> T.toDiscrete;
    let continuous =
      distPlus |> T.toContinuous |> E.O.fmap(DistFunctor.Continuous.getShape);
    let minX = T.minX(distPlus);
    let maxX = T.maxX(distPlus);
    let timeScale = distPlus.unit |> DistributionTypes.DistributionUnit.toJson;
    <CdfChart__Plain
      minX
      maxX
      ?discrete
      ?continuous
      color={`hex("333")}
      onHover
      timeScale
    />;
  };
};

module IntegralChart = {
  [@react.component]
  let make = (~distPlus: DistributionTypes.distPlus, ~onHover) => {
    open DistFunctor.DistPlus;
    let integral = DistFunctor.DistPlus.T.Integral.get(~cache=None, distPlus);
    let continuous =
      integral
      |> T.toContinuous
      |> E.O.fmap(DistFunctor.Continuous.toLinear)
      |> E.O.fmap(DistFunctor.Continuous.getShape);
    let minX = T.minX(integral);
    let maxX = T.maxX(integral);
    let timeScale = distPlus.unit |> DistributionTypes.DistributionUnit.toJson;
    <CdfChart__Plain
      minX
      maxX
      ?continuous
      color={`hex("333")}
      timeScale
      onHover
    />;
  };
};

[@react.component]
let make = (~distPlus: DistributionTypes.distPlus) => {
  let (x, setX) = React.useState(() => 0.);
  let chart =
    React.useMemo1(
      () => {<DistPlusChart distPlus onHover={r => {setX(_ => r)}} />},
      [|distPlus|],
    );
  let chart2 =
    React.useMemo1(
      () => {<IntegralChart distPlus onHover={r => {setX(_ => r)}} />},
      [|distPlus|],
    );
  <div>
    chart
    chart2
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
            {distPlus
             |> DistFunctor.DistPlus.T.Integral.xToY(~cache=None, x)
             |> E.Float.with2DigitsPrecision
             |> ReasonReact.string}
          </th>
        </tr>
      </tbody>
    </table>
    <div />
  </div>;
};