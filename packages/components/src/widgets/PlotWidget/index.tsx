import { Vega, VisualizationSpec } from "react-vega";

import { DistributionsChart } from "../DistWidget/DistributionsChart.js";
import { CHART_TO_DIST_HEIGHT_ADJUSTMENT } from "../DistWidget/index.js";
import { DistFunctionChart } from "../LambdaWidget/FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../LambdaWidget/FunctionChart/NumericFunctionChart.js";
import { widgetRegistry } from "../registry.js";
import { RelativeValuesGridChart } from "./RelativeValuesGridChart/index.js";
import { ScatterChart } from "./ScatterChart/index.js";

const vega = (spec: VisualizationSpec) => <Vega spec={spec} />;

widgetRegistry.register("Plot", {
  Chart: (value, settings) => {
    const plot = value.value;
    const environment = value.context.project.getEnvironment();

    switch (plot.tag) {
      case "distributions": {
        return (
          <DistributionsChart
            plot={plot}
            environment={environment}
            height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
          />
        );
      }
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
      case "vega": {
        const data = JSON.parse(plot.spec);
        return vega(data);
      }
      default:
        // can happen if squiggle-lang version is too fresh and we messed up the components -> squiggle-lang dependency
        return `Unsupported plot ${plot satisfies never}`;
    }
  },
});
