import { widgetRegistry } from "./registry.js";
import { Env, SqDistributionsPlot, SqLinearScale } from "@quri/squiggle-lang";
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;
import { generateDistributionPlotSettings } from "../components/PlaygroundSettings.js";
import { DistributionsChart } from "./DistWidget/DistributionsChart.js";

export const durationUnits = {
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
  Day: 24 * 60 * 60 * 1000,
  Year: 24 * 60 * 60 * 1000 * 365.25,
} as const;

function toUnit(ms: number): { value: number; name: string } {
  const units: [number, string][] = [
    [durationUnits.Year, "year"],
    [durationUnits.Day, "day"],
    [durationUnits.Hour, "hour"],
    [durationUnits.Minute, "minute"],
    [durationUnits.Second, "second"],
  ];

  for (const [unitValue, unitName] of units) {
    if (Math.abs(ms) >= unitValue) {
      return { value: unitValue, name: unitName };
    }
  }

  return { value: 1, name: "ms" };
}

const env: Env = {
  sampleCount: 1000,
  xyPointLength: 1000,
};

widgetRegistry.register("Duration", {
  Chart(value, settings) {
    const high = value.toDist().inv(env, 0.9);
    if (high.ok) {
      const unit = toUnit(high.value);
      const newDist = value.divideyByConstant(unit.value, env);
      const plot = SqDistributionsPlot.create({
        distribution: newDist.toDist(),
        ...generateDistributionPlotSettings(settings.distributionChartSettings),
        xScale: SqLinearScale.create({ title: unit.name + "s" }),
      });

      return (
        <DistributionsChart
          plot={plot}
          environment={value.context.project.getEnvironment()}
          height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
        />
      );
    }
  },
});
