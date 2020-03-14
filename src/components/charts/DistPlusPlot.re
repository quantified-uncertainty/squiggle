open DistPlusPlotReducer;

let showAsForm = (distPlus: DistTypes.distPlus) => {
  <div>
    <Antd.Input value={distPlus.guesstimatorString |> E.O.default("")} />
  </div>;
};

let showFloat = (~precision=3, number) =>
  <ForetoldComponents.NumberShower number precision />;

let table = (distPlus, x) => {
  <div>
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
  </div>;
};
let percentiles = distPlus => {
  <table className="table-auto text-sm">
    <thead>
      <tr>
        <td className="px-4 py-2"> {"1" |> ReasonReact.string} </td>
        <td className="px-4 py-2"> {"5" |> ReasonReact.string} </td>
        <td className="px-4 py-2"> {"25" |> ReasonReact.string} </td>
        <td className="px-4 py-2"> {"50" |> ReasonReact.string} </td>
        <td className="px-4 py-2"> {"75" |> ReasonReact.string} </td>
        <td className="px-4 py-2"> {"95" |> ReasonReact.string} </td>
        <td className="px-4 py-2"> {"99" |> ReasonReact.string} </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="px-4 py-2 border">
          {distPlus
           |> Distributions.DistPlus.T.Integral.yToX(~cache=None, 0.01)
           |> showFloat}
        </td>
        <td className="px-4 py-2 border">
          {distPlus
           |> Distributions.DistPlus.T.Integral.yToX(~cache=None, 0.05)
           |> showFloat}
        </td>
        <td className="px-4 py-2 border">
          {distPlus
           |> Distributions.DistPlus.T.Integral.yToX(~cache=None, 0.25)
           |> showFloat}
        </td>
        <td className="px-4 py-2 border">
          {distPlus
           |> Distributions.DistPlus.T.Integral.yToX(~cache=None, 0.5)
           |> showFloat}
        </td>
        <td className="px-4 py-2 border">
          {distPlus
           |> Distributions.DistPlus.T.Integral.yToX(~cache=None, 0.75)
           |> showFloat}
        </td>
        <td className="px-4 py-2 border">
          {distPlus
           |> Distributions.DistPlus.T.Integral.yToX(~cache=None, 0.95)
           |> showFloat}
        </td>
        <td className="px-4 py-2 border">
          {distPlus
           |> Distributions.DistPlus.T.Integral.yToX(~cache=None, 0.99)
           |> showFloat}
        </td>
      </tr>
    </tbody>
  </table>;
};

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
  let make = (~distPlus: DistTypes.distPlus, ~config: chartConfig, ~onHover) => {
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
      xScale={config.xLog ? "log" : "linear"}
      yScale={config.yLog ? "log" : "linear"}
      height={DistPlusPlotReducer.heightToPix(config.height)}
      minX
      maxX
      yMaxDiscreteDomainFactor
      yMaxContinuousDomainFactor
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
  let make = (~distPlus: DistTypes.distPlus, ~config: chartConfig, ~onHover) => {
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
      xScale={config.xLog ? "log" : "linear"}
      yScale={config.yLog ? "log" : "linear"}
      height={DistPlusPlotReducer.heightToPix(config.height)}
      minX
      maxX
      ?continuous
      color={`hex("5f6b7e")}
      timeScale
      onHover
    />;
  };
};

module Chart = {
  [@react.component]
  let make = (~distPlus: DistTypes.distPlus, ~config: chartConfig, ~onHover) => {
    let chart =
      React.useMemo2(
        () => {
          config.isCumulative
            ? <IntegralChart distPlus config onHover />
            : <DistPlusChart distPlus config onHover />
        },
        (distPlus, config),
      );
    <div
      className=Css.(
        style([
          minHeight(`px(DistPlusPlotReducer.heightToPix(config.height))),
        ])
      )>
      chart
    </div>;
  };
};

let button = "bg-gray-300 hover:bg-gray-500 text-grey-darkest text-xs px-4 py-1";

[@react.component]
let make = (~distPlus: DistTypes.distPlus) => {
  let (x, setX) = React.useState(() => 0.);
  let (state, dispatch) =
    React.useReducer(DistPlusPlotReducer.reducer, DistPlusPlotReducer.init);
  <div>
    {state.distributions
     |> E.L.fmapi((index, config) =>
          <div className="flex">
            <div className="w-4/5">
              <Chart distPlus config onHover={r => {setX(_ => r)}} />
            </div>
            <div className="w-1/5">
              <div className="opacity-50 hover:opacity-100">
                <button
                  className=button
                  onClick={_ => dispatch(CHANGE_X_LOG(index))}>
                  {(config.xLog ? "x-log" : "x-linear") |> ReasonReact.string}
                </button>
                <button
                  className=button
                  onClick={_ => dispatch(CHANGE_Y_LOG(index))}>
                  {(config.yLog ? "y-log" : "y-linear") |> ReasonReact.string}
                </button>
                <button
                  className=button
                  onClick={_ =>
                    dispatch(
                      CHANGE_IS_CUMULATIVE(index, !config.isCumulative),
                    )
                  }>
                  {(config.isCumulative ? "cdf" : "pdf") |> ReasonReact.string}
                </button>
                <button
                  className=button
                  onClick={_ => dispatch(HEIGHT_INCREMENT(index))}>
                  {"expand" |> ReasonReact.string}
                </button>
                <button
                  className=button
                  onClick={_ => dispatch(HEIGHT_DECREMENT(index))}>
                  {"shrink" |> ReasonReact.string}
                </button>
                {index != 0
                   ? <button
                       className=button
                       onClick={_ => dispatch(REMOVE_DIST(index))}>
                       {"remove" |> ReasonReact.string}
                     </button>
                   : ReasonReact.null}
              </div>
            </div>
          </div>
        )
     |> E.L.toArray
     |> ReasonReact.array}
    <div className="inline-flex opacity-50 hover:opacity-100">
      <button
        className=button onClick={_ => dispatch(CHANGE_SHOW_PERCENTILES)}>
        {"Percentiles" |> ReasonReact.string}
      </button>
      <button className=button onClick={_ => dispatch(CHANGE_SHOW_STATS)}>
        {"Debug Stats" |> ReasonReact.string}
      </button>
      <button className=button onClick={_ => dispatch(CHANGE_SHOW_PARAMS)}>
        {"Params" |> ReasonReact.string}
      </button>
      <button className=button onClick={_ => dispatch(ADD_DIST)}>
        {"Add" |> ReasonReact.string}
      </button>
    </div>
    {state.showParams ? showAsForm(distPlus) : ReasonReact.null}
    {state.showStats ? table(distPlus, x) : ReasonReact.null}
    {state.showPercentiles ? percentiles(distPlus) : ReasonReact.null}
  </div>;
};