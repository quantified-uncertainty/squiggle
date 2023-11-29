import { widgetRegistry } from "./registry.js";
import { SqDistributionsPlot } from "@quri/squiggle-lang";
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;
import { generateDistributionPlotSettings } from "../components/PlaygroundSettings.js";
import { DistributionsChart } from "./DistWidget/DistributionsChart.js";

widgetRegistry.register("Duration", {
  Chart(value, settings) {
    const plot = SqDistributionsPlot.create({
      distribution: value.toDist(),
      ...generateDistributionPlotSettings(settings.distributionChartSettings),
    });

    return (
      <DistributionsChart
        plot={plot}
        environment={value.context.project.getEnvironment()}
        height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
      />
    );
  },
});
