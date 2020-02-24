module DistPlusChart = {
  [@react.component]
  let make = (~distPlus: DistTypes.distPlus, ~onHover) => {
    open Distributions.DistPlus;
    // todo: Change to scaledContinuous and scaledDiscrete
    let discrete = distPlus |> T.toDiscrete;
    let continuous =
      distPlus
      |> T.toContinuous
      |> E.O.fmap(Distributions.Continuous.getShape);
    let minX = T.minX(distPlus);
    let maxX = T.maxX(distPlus);
    let timeScale = distPlus.unit |> DistTypes.DistributionUnit.toJson;
    <DistributionPlot
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
  let make = (~distPlus: DistTypes.distPlus, ~onHover) => {
    open Distributions.DistPlus;
    let integral =
      Distributions.DistPlus.T.Integral.get(~cache=None, distPlus);
    let continuous =
      integral
      |> T.toContinuous
      |> E.O.bind(_, Distributions.Continuous.toLinear)
      |> E.O.fmap(Distributions.Continuous.getShape);
    let minX = T.minX(integral);
    let maxX = T.maxX(integral);
    let timeScale = distPlus.unit |> DistTypes.DistributionUnit.toJson;
    <DistributionPlot
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
let make = (~distPlus: DistTypes.distPlus) => {
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
            {"Discrete Value" |> ReasonReact.string}
          </th>
          <th className="px-4 py-2">
            {"Continuous Value" |> ReasonReact.string}
          </th>
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
             |> Distributions.DistPlus.T.xToY(x)
             |> DistTypes.MixedPoint.toDiscreteValue
             |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
             |> ReasonReact.string}
          </th>
          <th className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.xToY(x)
             |> DistTypes.MixedPoint.toContinuousValue
             |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
             |> ReasonReact.string}
          </th>
          <th className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.Integral.xToY(~cache=None, x)
             |> E.Float.with2DigitsPrecision
             |> ReasonReact.string}
          </th>
          <th className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.Integral.sum(~cache=None)
             |> E.Float.with2DigitsPrecision
             |> ReasonReact.string}
          </th>
        </tr>
      </tbody>
    </table>
    <div />
  </div>;
  // chart
};