let adjustBoth = discreteProbabilityMass => {
  let yMaxDiscreteDomainFactor = discreteProbabilityMass;
  let yMaxContinuousDomainFactor = 1.0 -. discreteProbabilityMass;
  let yMax =
    yMaxDiscreteDomainFactor > yMaxContinuousDomainFactor
      ? yMaxDiscreteDomainFactor : yMaxContinuousDomainFactor;
  (
    1.0 /. (yMaxDiscreteDomainFactor /. yMax),
    1.0 /. (yMaxContinuousDomainFactor /. yMax),
  );
};

module DistPlusChart = {
  [@react.component]
  let make = (~distPlus: DistTypes.distPlus, ~onHover) => {
    open Distributions.DistPlus;
    let discrete = distPlus |> T.toScaledDiscrete;
    let continuous =
      distPlus
      |> T.toScaledContinuous
      |> E.O.fmap(Distributions.Continuous.getShape);
    let range = T.xTotalRange(distPlus);
    let minX =
      switch (T.minX(distPlus), range) {
      | (Some(min), Some(range)) => Some(min -. range *. 0.001)
      | _ => None
      };

    let maxX = T.maxX(distPlus);
    let timeScale = distPlus.unit |> DistTypes.DistributionUnit.toJson;
    let toDiscreteProbabilityMass =
      distPlus |> Distributions.DistPlus.T.toDiscreteProbabilityMass;
    let (yMaxDiscreteDomainFactor, yMaxContinuousDomainFactor) =
      adjustBoth(toDiscreteProbabilityMass);
    <DistributionPlot
      minX
      maxX
      yMaxDiscreteDomainFactor
      yMaxContinuousDomainFactor
      height=120
      ?discrete
      ?continuous
      color={`hex("5f6b7e")}
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
      Distributions.DistPlus.T.toShape(distPlus)
      |> Distributions.Shape.T.Integral.get(~cache=None);
    let continuous =
      integral
      |> Distributions.Continuous.toLinear
      |> E.O.fmap(Distributions.Continuous.getShape);
    let range = T.xTotalRange(distPlus);
    let minX =
      switch (T.minX(distPlus), range) {
      | (Some(min), Some(range)) => Some(min -. range *. 0.001)
      | _ => None
      };
    let maxX = integral |> Distributions.Continuous.T.maxX;
    let timeScale = distPlus.unit |> DistTypes.DistributionUnit.toJson;
    <DistributionPlot
      minX
      maxX
      height=80
      ?continuous
      color={`hex("5f6b7e")}
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
    <table className="table-auto text-sm">
      <thead>
        <tr>
          <td className="px-4 py-2 "> {"X Point" |> ReasonReact.string} </td>
          <td className="px-4 py-2">
            {"Discrete Value" |> ReasonReact.string}
          </td>
          <td className="px-4 py-2">
            {"Continuous Value" |> ReasonReact.string}
          </td>
          <td className="px-4 py-2">
            {"Y Integral to Point" |> ReasonReact.string}
          </td>
          <td className="px-4 py-2">
            {"Y Integral Total" |> ReasonReact.string}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border">
            {x |> E.Float.toString |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.xToY(x)
             |> DistTypes.MixedPoint.toDiscreteValue
             |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.xToY(x)
             |> DistTypes.MixedPoint.toContinuousValue
             |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.Integral.xToY(~cache=None, x)
             |> E.Float.with2DigitsPrecision
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.Integral.sum(~cache=None)
             |> E.Float.with2DigitsPrecision
             |> ReasonReact.string}
          </td>
        </tr>
      </tbody>
    </table>
    <table className="table-auto text-sm">
      <thead>
        <tr>
          <td className="px-4 py-2">
            {"Continuous Total" |> ReasonReact.string}
          </td>
          <td className="px-4 py-2">
            {"Scaled Continuous Total" |> ReasonReact.string}
          </td>
          <td className="px-4 py-2">
            {"Discrete Total" |> ReasonReact.string}
          </td>
          <td className="px-4 py-2">
            {"Scaled Discrete Total" |> ReasonReact.string}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border">
            {distPlus
             |> Distributions.DistPlus.T.toContinuous
             |> E.O.fmap(
                  Distributions.Continuous.T.Integral.sum(~cache=None),
                )
             |> E.O.fmap(E.Float.with2DigitsPrecision)
             |> E.O.default("")
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.toScaledContinuous
             |> E.O.fmap(
                  Distributions.Continuous.T.Integral.sum(~cache=None),
                )
             |> E.O.fmap(E.Float.with2DigitsPrecision)
             |> E.O.default("")
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.toDiscrete
             |> E.O.fmap(Distributions.Discrete.T.Integral.sum(~cache=None))
             |> E.O.fmap(E.Float.with2DigitsPrecision)
             |> E.O.default("")
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> Distributions.DistPlus.T.toScaledDiscrete
             |> E.O.fmap(Distributions.Discrete.T.Integral.sum(~cache=None))
             |> E.O.fmap(E.Float.with2DigitsPrecision)
             |> E.O.default("")
             |> ReasonReact.string}
          </td>
        </tr>
      </tbody>
    </table>
    <div />
  </div>;
  // chart
};