import {
  SDateNumber,
  SqDateScale,
  SqDistributionsPlot,
} from "@quri/squiggle-lang";
import { widgetRegistry } from "./registry.js";
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;
import { generateDistributionPlotSettings } from "../components/PlaygroundSettings.js";
import { DistributionsChart } from "./DistWidget/DistributionsChart.js";

widgetRegistry.register("Date", {
  Preview(value) {
    const dist = value.value.toMs();
    const p05 = dist.inv(0.05);
    const p95 = dist.inv(0.95);
    const oneValue = p05 === p95;
    const show = (f: number) => SDateNumber.fromMs(f).toString();

    return oneValue ? (
      show(p05)
    ) : (
      <div>
        {show(p05)}
        <span className="mx-1 opacity-70">to</span>
        {show(p95)}
      </div>
    );
  },

  Chart(value, settings) {
    const plot = SqDistributionsPlot.create({
      distribution: value.toDist(),
      ...generateDistributionPlotSettings(settings.distributionChartSettings),
      xScale: SqDateScale.create({}),
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
