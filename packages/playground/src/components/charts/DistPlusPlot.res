open DistPlusPlotReducer
let plotBlue = #hex("1860ad")

let showAsForm = (distPlus: SquiggleLang.PointSetTypes.distPlus) =>
  <div> <Antd.Input value={distPlus.squiggleString |> E.O.default("")} /> </div>

let showFloat = (~precision=3, number) => <NumberShower number precision />

let table = (distPlus, x) =>
  <div>
    <table className="table-auto text-sm">
      <thead>
        <tr>
          <td className="px-4 py-2 "> {"X Point" |> React.string} </td>
          <td className="px-4 py-2"> {"Discrete Value" |> React.string} </td>
          <td className="px-4 py-2"> {"Continuous Value" |> React.string} </td>
          <td className="px-4 py-2"> {"Y Integral to Point" |> React.string} </td>
          <td className="px-4 py-2"> {"Y Integral Total" |> React.string} </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border"> {x |> E.Float.toString |> React.string} </td>
          <td className="px-4 py-2 border ">
            {distPlus
            |> SquiggleLang.DistPlus.T.xToY(x)
            |> SquiggleLang.PointSetTypes.MixedPoint.toDiscreteValue
            |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
            |> React.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
            |> SquiggleLang.DistPlus.T.xToY(x)
            |> SquiggleLang.PointSetTypes.MixedPoint.toContinuousValue
            |> Js.Float.toPrecisionWithPrecision(_, ~digits=7)
            |> React.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
            |> SquiggleLang.DistPlus.T.Integral.xToY(x)
            |> E.Float.with2DigitsPrecision
            |> React.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
            |> SquiggleLang.DistPlus.T.Integral.sum
            |> E.Float.with2DigitsPrecision
            |> React.string}
          </td>
        </tr>
      </tbody>
    </table>
    <table className="table-auto text-sm">
      <thead>
        <tr>
          <td className="px-4 py-2"> {"Continuous Total" |> React.string} </td>
          <td className="px-4 py-2"> {"Discrete Total" |> React.string} </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border">
            {distPlus
            |> SquiggleLang.DistPlus.T.toContinuous
            |> E.O.fmap(SquiggleLang.Continuous.T.Integral.sum)
            |> E.O.fmap(E.Float.with2DigitsPrecision)
            |> E.O.default("")
            |> React.string}
          </td>
          <td className="px-4 py-2 border ">
            {distPlus
            |> SquiggleLang.DistPlus.T.toDiscrete
            |> E.O.fmap(SquiggleLang.Discrete.T.Integral.sum)
            |> E.O.fmap(E.Float.with2DigitsPrecision)
            |> E.O.default("")
            |> React.string}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
let percentiles = distPlus =>
  <div>
    <table className="table-auto text-sm">
      <thead>
        <tr>
          <td className="px-4 py-2"> {"1" |> React.string} </td>
          <td className="px-4 py-2"> {"5" |> React.string} </td>
          <td className="px-4 py-2"> {"25" |> React.string} </td>
          <td className="px-4 py-2"> {"50" |> React.string} </td>
          <td className="px-4 py-2"> {"75" |> React.string} </td>
          <td className="px-4 py-2"> {"95" |> React.string} </td>
          <td className="px-4 py-2"> {"99" |> React.string} </td>
          <td className="px-4 py-2"> {"99.999" |> React.string} </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.01) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.05) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.25) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.5) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.75) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.95) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.99) |> showFloat}
          </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.99999) |> showFloat}
          </td>
        </tr>
      </tbody>
    </table>
    <table className="table-auto text-sm">
      <thead>
        <tr>
          <td className="px-4 py-2"> {"mean" |> React.string} </td>
          <td className="px-4 py-2"> {"standard deviation" |> React.string} </td>
          <td className="px-4 py-2"> {"variance" |> React.string} </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 py-2 border"> {distPlus |> SquiggleLang.DistPlus.T.mean |> showFloat} </td>
          <td className="px-4 py-2 border">
            {distPlus |> SquiggleLang.DistPlus.T.variance |> (r => r ** 0.5) |> showFloat}
          </td>
          <td className="px-4 py-2 border"> {distPlus |> SquiggleLang.DistPlus.T.variance |> showFloat} </td>
        </tr>
      </tbody>
    </table>
  </div>

let adjustBoth = discreteProbabilityMassFraction => {
  let yMaxDiscreteDomainFactor = discreteProbabilityMassFraction
  let yMaxContinuousDomainFactor = 1.0 -. discreteProbabilityMassFraction

  // use the bigger proportion, such that whichever is the bigger proportion, the yMax is 1.

  let yMax = yMaxDiscreteDomainFactor > 0.5 ? yMaxDiscreteDomainFactor : yMaxContinuousDomainFactor
  (yMax /. yMaxDiscreteDomainFactor, yMax /. yMaxContinuousDomainFactor)
}

module DistPlusChart = {
  @react.component
  let make = (~distPlus: SquiggleLang.PointSetTypes.distPlus, ~config: chartConfig, ~onHover) => {
    open SquiggleLang.DistPlus

    let discrete = distPlus |> T.toDiscrete |> E.O.fmap(SquiggleLang.Discrete.getShape)
    let continuous = distPlus |> T.toContinuous |> E.O.fmap(SquiggleLang.Continuous.getShape)

    // // We subtract a bit from the range to make sure that it fits. Maybe this should be done in d3 instead.
    // let minX =
    //   switch (
    //     distPlus
    //     |> DistPlus.T.Integral.yToX(0.0001),
    //     range,
    //   ) {
    //   | (min, Some(range)) => Some(min -. range *. 0.001)
    //   | _ => None
    //   };

    let minX = distPlus |> T.Integral.yToX(0.00001)

    let maxX = distPlus |> T.Integral.yToX(0.99999)

    let timeScale = distPlus.unit |> SquiggleLang.PointSetTypes.DistributionUnit.toJson
    let discreteProbabilityMassFraction = distPlus |> T.toDiscreteProbabilityMassFraction

    let (yMaxDiscreteDomainFactor, yMaxContinuousDomainFactor) = adjustBoth(
      discreteProbabilityMassFraction,
    )

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
    />
  }
}

module IntegralChart = {
  @react.component
  let make = (~distPlus: SquiggleLang.PointSetTypes.distPlus, ~config: chartConfig, ~onHover) => {
    let integral = distPlus.integralCache
    let continuous = integral |> SquiggleLang.Continuous.toLinear |> E.O.fmap(SquiggleLang.Continuous.getShape)
    let minX = distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.00001)

    let maxX = distPlus |> SquiggleLang.DistPlus.T.Integral.yToX(0.99999)
    let timeScale = distPlus.unit |> SquiggleLang.PointSetTypes.DistributionUnit.toJson
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
    />
  }
}

module Chart = {
  @react.component
  let make = (~distPlus: SquiggleLang.PointSetTypes.distPlus, ~config: chartConfig, ~onHover) => {
    let chart = React.useMemo2(
      () =>
        config.isCumulative
          ? <IntegralChart distPlus config onHover />
          : <DistPlusChart distPlus config onHover />,
      (distPlus, config),
    )
    <div
      className={
        open CssJs
        style(. [ minHeight(#px(DistPlusPlotReducer.heightToPix(config.height))) ])
      }>
      chart
    </div>
  }
}

let button = "bg-gray-300 hover:bg-gray-500 text-grey-darkest text-xs px-4 py-1"

@react.component
let make = (~distPlus: SquiggleLang.PointSetTypes.distPlus) => {
  let (x, setX) = React.useState(() => 0.)
  let (state, dispatch) = React.useReducer(DistPlusPlotReducer.reducer, DistPlusPlotReducer.init)

  <div>
    {state.distributions
    |> E.L.fmapi((index, config) =>
      <div className="flex" key={string_of_int(index)}>
        <div className="w-4/5"> <Chart distPlus config onHover={r => setX(_ => r)} /> </div>
        <div className="w-1/5">
          <div className="opacity-50 hover:opacity-100">
            <button className=button onClick={_ => dispatch(CHANGE_X_LOG(index))}>
              {(config.xLog ? "x-log" : "x-linear") |> React.string}
            </button>
            <button className=button onClick={_ => dispatch(CHANGE_Y_LOG(index))}>
              {(config.yLog ? "y-log" : "y-linear") |> React.string}
            </button>
            <button
              className=button
              onClick={_ => dispatch(CHANGE_IS_CUMULATIVE(index, !config.isCumulative))}>
              {(config.isCumulative ? "cdf" : "pdf") |> React.string}
            </button>
            <button className=button onClick={_ => dispatch(HEIGHT_INCREMENT(index))}>
              {"expand" |> React.string}
            </button>
            <button className=button onClick={_ => dispatch(HEIGHT_DECREMENT(index))}>
              {"shrink" |> React.string}
            </button>
            {index != 0
              ? <button className=button onClick={_ => dispatch(REMOVE_DIST(index))}>
                  {"remove" |> React.string}
                </button>
              : React.null}
          </div>
        </div>
      </div>
    )
    |> E.L.toArray
    |> React.array}
    <div className="inline-flex opacity-50 hover:opacity-100">
      <button className=button onClick={_ => dispatch(CHANGE_SHOW_PERCENTILES)}>
        {"Percentiles" |> React.string}
      </button>
      <button className=button onClick={_ => dispatch(CHANGE_SHOW_STATS)}>
        {"Debug Stats" |> React.string}
      </button>
      <button className=button onClick={_ => dispatch(CHANGE_SHOW_PARAMS)}>
        {"Params" |> React.string}
      </button>
      <button className=button onClick={_ => dispatch(ADD_DIST)}>
        {"Add" |> React.string}
      </button>
    </div>
    {state.showParams ? showAsForm(distPlus) : React.null}
    {state.showStats ? table(distPlus, x) : React.null}
    {state.showPercentiles ? percentiles(distPlus) : React.null}
  </div>
}
