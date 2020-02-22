module ComplexPowerChart = {
  [@react.component]
  let make = (~complexPower: DistributionTypes.complexPower, ~onHover) => {
    open DistFunctor.ComplexPower;
    let discrete = complexPower |> T.toDiscrete;
    let continuous =
      complexPower
      |> T.toContinuous
      |> E.O.fmap(DistFunctor.Continuous.getShape);
    let minX = T.minX(complexPower);
    let maxX = T.maxX(complexPower);
    let timeScale =
      complexPower.unit |> DistributionTypes.DistributionUnit.toJson;
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

let bar: DistributionTypes.xyShape = {
  ys: [|0.5, 0.8, 0.4, 1.0, 2.0|],
  xs: [|0.0, 1., 2., 5., 8.|],
};

module IntegralChart = {
  [@react.component]
  let make = (~complexPower: DistributionTypes.complexPower, ~onHover) => {
    open DistFunctor.ComplexPower;
    let integral =
      DistFunctor.ComplexPower.T.Integral.get(~cache=None, complexPower);
    let continuous =
      integral
      |> T.toContinuous
      |> E.O.fmap(DistFunctor.Continuous.toLinear)
      |> E.O.fmap(DistFunctor.Continuous.getShape);
    let minX = T.minX(integral);
    let maxX = T.maxX(integral);
    let timeScale =
      complexPower.unit |> DistributionTypes.DistributionUnit.toJson;
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
let make = (~complexPower: DistributionTypes.complexPower) => {
  let (x, setX) = React.useState(() => 0.);
  let chart =
    React.useMemo1(
      () => {<ComplexPowerChart complexPower onHover={r => {setX(_ => r)}} />},
      [|complexPower|],
    );
  let chart2 =
    React.useMemo1(
      () => {<IntegralChart complexPower onHover={r => {setX(_ => r)}} />},
      [|complexPower|],
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
            {complexPower
             |> DistFunctor.ComplexPower.T.Integral.xToY(~cache=None, x)
             |> E.Float.with2DigitsPrecision
             |> ReasonReact.string}
          </th>
        </tr>
      </tbody>
    </table>
    <div />
  </div>;
};