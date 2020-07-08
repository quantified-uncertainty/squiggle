open DistPlusPlotReducer;
let plotBlue = `hex("1860ad");

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
             |> DistPlus.T.xToY(x)
             |> DistTypes.MixedPoint.toDiscreteValue
             |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> DistPlus.T.xToY(x)
             |> DistTypes.MixedPoint.toContinuousValue
             |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> DistPlus.T.Integral.xToY(~cache=None, x)
             |> E.Float.with2DigitsPrecision
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> DistPlus.T.Integral.sum(~cache=None)
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
             |> DistPlus.T.toContinuous
             |> E.O.fmap(
                  Continuous.T.Integral.sum(~cache=None),
                )
             |> E.O.fmap(E.Float.with2DigitsPrecision)
             |> E.O.default("")
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> DistPlus.T.normalizedToContinuous
             |> E.O.fmap(
                  Continuous.T.Integral.sum(~cache=None),
                )
             |> E.O.fmap(E.Float.with2DigitsPrecision)
             |> E.O.default("")
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> DistPlus.T.toDiscrete
             |> E.O.fmap(Discrete.T.Integral.sum(~cache=None))
             |> E.O.fmap(E.Float.with2DigitsPrecision)
             |> E.O.default("")
             |> ReasonReact.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
             |> DistPlus.T.normalizedToDiscrete
             |> E.O.fmap(Discrete.T.Integral.sum(~cache=None))
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
  <div>
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
          <td className="px-4 py-2"> {"99.999" |> ReasonReact.string} </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.01)
             |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.05)
             |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.25)
             |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.5)
             |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.75)
             |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.95)
             |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.99)
             |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus
             |> DistPlus.T.Integral.yToX(~cache=None, 0.99999)
             |> showFloat}
          </td>
        </tr>
      </tbody>
    </table>
    <table className="table-auto text-sm">
      <thead>
        <tr>
          <td className="px-4 py-2"> {"mean" |> ReasonReact.string} </td>
          <td className="px-4 py-2">
            {"standard deviation" |> ReasonReact.string}
          </td>
          <td className="px-4 py-2"> {"variance" |> ReasonReact.string} </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border">
            {distPlus |> DistPlus.T.mean |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> DistPlus.T.variance |> (r => r ** 0.5) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> DistPlus.T.variance |> showFloat}
          </td>
        </tr>
      </tbody>
    </table>
  </div>;
};

let adjustBoth = discreteProbabilityMassFraction => {
  let yMaxDiscreteDomainFactor = discreteProbabilityMassFraction;
  let yMaxContinuousDomainFactor = 1.0 -. discreteProbabilityMassFraction;
  let yMax = (yMaxDiscreteDomainFactor > 0.5 ? yMaxDiscreteDomainFactor : yMaxContinuousDomainFactor);
  (
    yMax /. yMaxDiscreteDomainFactor,
    yMax /. yMaxContinuousDomainFactor,
  );
};

module DistPlusChart = {
  [@react.component]
  let make = (~distPlus: DistTypes.distPlus, ~config: chartConfig, ~onHover) => {
    open DistPlus;
    let discrete = distPlus |> T.normalizedToDiscrete |> E.O.fmap(Discrete.getShape);
    let continuous =
      distPlus
      |> T.normalizedToContinuous
      |> E.O.fmap(Continuous.getShape);
    let range = T.xTotalRange(distPlus);

    // // We subtract a bit from the range to make sure that it fits. Maybe this should be done in d3 instead.
    // let minX =
    //   switch (
    //     distPlus
    //     |> DistPlus.T.Integral.yToX(~cache=None, 0.0001),
    //     range,
    //   ) {
    //   | (min, Some(range)) => Some(min -. range *. 0.001)
    //   | _ => None
    //   };

    let minX = {
      distPlus |> DistPlus.T.Integral.yToX(~cache=None, 0.00001);
    };

    let maxX = {
      distPlus |> DistPlus.T.Integral.yToX(~cache=None, 0.99);
    };

    let timeScale = distPlus.unit |> DistTypes.DistributionUnit.toJson;
    let discreteProbabilityMassFraction =
      distPlus |> DistPlus.T.toDiscreteProbabilityMassFraction;
    let (yMaxDiscreteDomainFactor, yMaxContinuousDomainFactor) =
      adjustBoth(discreteProbabilityMassFraction);
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
      color=plotBlue
      onHover
      timeScale
    />;
  };
};

module IntegralChart = {
  [@react.component]
  let make = (~distPlus: DistTypes.distPlus, ~config: chartConfig, ~onHover) => {
    open DistPlus;
    let integral = distPlus.integralCache;
    let continuous =
      integral
      |> Continuous.toLinear
      |> E.O.fmap(Continuous.getShape);
    let minX = {
      distPlus |> DistPlus.T.Integral.yToX(~cache=None, 0.00001);
    };

    let maxX = {
      distPlus |> DistPlus.T.Integral.yToX(~cache=None, 0.99);
    };
    let timeScale = distPlus.unit |> DistTypes.DistributionUnit.toJson;
    <DistributionPlot
      xScale={config.xLog ? "log" : "linear"}
      yScale={config.yLog ? "log" : "linear"}
      height={DistPlusPlotReducer.heightToPix(config.height)}
      minX
      maxX
      ?continuous
      color=plotBlue
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
          <div className="flex" key={string_of_int(index)}>
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
