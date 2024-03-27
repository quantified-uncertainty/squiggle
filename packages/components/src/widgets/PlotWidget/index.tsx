import { Vega } from "react-vega";

import { DistFunctionChart } from "../LambdaWidget/FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../LambdaWidget/FunctionChart/NumericFunctionChart.js";
import { widgetRegistry } from "../registry.js";
import { RelativeValuesGridChart } from "./RelativeValuesGridChart/index.js";
import { ScatterChart } from "./ScatterChart/index.js";

const foo = (
  <Vega
    spec={{
      width: "container",
      height: 300,
      mark: {
        type: "line",
        point: true,
      },
      encoding: {
        x: { field: "date", type: "temporal", timeUnit: "year" },
        y: { field: "value", type: "quantitative" },
      },
      data: {
        values: [
          { date: "2010-01-01", value: 28 },
          { date: "2010-03-01", value: 33 },
          { date: "2010-05-01", value: 41 },
          { date: "2010-07-01", value: 37 },
          { date: "2010-09-01", value: 29 },
          { date: "2010-11-01", value: 35 },
          { date: "2011-01-01", value: 43 },
          { date: "2011-03-01", value: 48 },
          { date: "2011-05-01", value: 56 },
          { date: "2011-07-01", value: 62 },
          { date: "2011-09-01", value: 54 },
          { date: "2011-11-01", value: 60 },
          { date: "2012-01-01", value: 81 },
          { date: "2012-03-01", value: 86 },
          { date: "2012-05-01", value: 94 },
          { date: "2012-07-01", value: 100 },
          { date: "2012-09-01", value: 92 },
          { date: "2012-11-01", value: 98 },
          { date: "2013-01-01", value: 19 },
          { date: "2013-03-01", value: 24 },
          { date: "2013-05-01", value: 32 },
          { date: "2013-07-01", value: 28 },
          { date: "2013-09-01", value: 20 },
          { date: "2013-11-01", value: 26 },
          { date: "2014-01-01", value: 52 },
          { date: "2014-03-01", value: 57 },
          { date: "2014-05-01", value: 65 },
          { date: "2014-07-01", value: 71 },
          { date: "2014-09-01", value: 63 },
          { date: "2014-11-01", value: 69 },
          { date: "2015-01-01", value: 24 },
          { date: "2015-03-01", value: 29 },
          { date: "2015-05-01", value: 37 },
          { date: "2015-07-01", value: 33 },
          { date: "2015-09-01", value: 25 },
          { date: "2015-11-01", value: 31 },
          { date: "2016-01-01", value: 87 },
          { date: "2016-03-01", value: 92 },
          { date: "2016-05-01", value: 100 },
          { date: "2016-07-01", value: 106 },
          { date: "2016-09-01", value: 98 },
          { date: "2016-11-01", value: 104 },
          { date: "2017-01-01", value: 66 },
          { date: "2017-03-01", value: 71 },
          { date: "2017-05-01", value: 79 },
          { date: "2017-07-01", value: 85 },
          { date: "2017-09-01", value: 77 },
          { date: "2017-11-01", value: 83 },
          { date: "2018-01-01", value: 17 },
          { date: "2018-03-01", value: 22 },
          { date: "2018-05-01", value: 30 },
          { date: "2018-07-01", value: 26 },
          { date: "2018-09-01", value: 18 },
          { date: "2018-11-01", value: 24 },
          { date: "2019-01-01", value: 68 },
          { date: "2019-03-01", value: 73 },
          { date: "2019-05-01", value: 81 },
          { date: "2019-07-01", value: 87 },
          { date: "2019-09-01", value: 79 },
          { date: "2019-11-01", value: 85 },
          { date: "2020-01-01", value: 49 },
          { date: "2020-03-01", value: 54 },
          { date: "2020-05-01", value: 62 },
          { date: "2020-07-01", value: 58 },
          { date: "2020-09-01", value: 50 },
          { date: "2020-11-01", value: 56 },
        ],
      },
    }}
  />
);

widgetRegistry.register("Plot", {
  Chart: (value, settings) => {
    const plot = value.value;
    const environment = value.context.project.getEnvironment();

    switch (plot.tag) {
      case "distributions":
        return foo;
      // <DistributionsChart
      //   plot={plot}
      //   environment={environment}
      //   height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
      // />
      case "numericFn": {
        return (
          <NumericFunctionChart
            plot={plot}
            environment={environment}
            height={settings.chartHeight}
            xCount={settings.functionChartSettings.count}
          />
        );
      }
      case "distFn": {
        return (
          <DistFunctionChart
            plot={plot}
            environment={{
              sampleCount: environment.sampleCount / 10,
              xyPointLength: environment.xyPointLength / 10,
              seed: environment.seed,
            }}
            height={settings.chartHeight}
            xCount={settings.functionChartSettings.count}
          />
        );
      }
      case "scatter":
        return (
          <ScatterChart
            plot={plot}
            environment={environment}
            height={settings.chartHeight}
          />
        );
      case "relativeValues":
        return (
          <RelativeValuesGridChart plot={plot} environment={environment} />
        );
      default:
        // can happen if squiggle-lang version is too fresh and we messed up the components -> squiggle-lang dependency
        return `Unsupported plot ${plot satisfies never}`;
    }
  },
});
