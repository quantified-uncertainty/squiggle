import { lazy, Suspense } from "react";
import { VisualizationSpec } from "react-vega";

import { DistributionsChart } from "../DistWidget/DistributionsChart.js";
import { CHART_TO_DIST_HEIGHT_ADJUSTMENT } from "../DistWidget/index.js";
import { DistFunctionChart } from "../LambdaWidget/FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../LambdaWidget/FunctionChart/NumericFunctionChart.js";
import { widgetRegistry } from "../registry.js";
import { RelativeValuesGridChart } from "./RelativeValuesGridChart/index.js";
import { ScatterChart } from "./ScatterChart/index.js";

const VegaLazy = lazy(() =>
  import("react-vega").then((module) => ({ default: module.Vega }))
);

const vega = (spec: VisualizationSpec) => (
  <Suspense fallback={<div>Loading...</div>}>
    <VegaLazy spec={spec} />
  </Suspense>
);

widgetRegistry.register("Plot", {
  Chart: (value, settings) => {
    const plot = value.value;
    const environment = value.context.project.getEnvironment();

    switch (plot.tag) {
      case "distributions":
        return (
          <DistributionsChart
            plot={plot}
            environment={environment}
            height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
          />
        );
      case "numericFn":
        return (
          <NumericFunctionChart
            plot={plot}
            environment={environment}
            height={settings.chartHeight}
            xCount={settings.functionChartSettings.count}
          />
        );
      case "distFn":
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
      case "vega":
        return vega(JSON.parse(plot.spec));
      default:
        // can happen if squiggle-lang version is too fresh and we messed up the components -> squiggle-lang dependency
        return `Unsupported plot ${plot satisfies never}`;
    }
  },
});
