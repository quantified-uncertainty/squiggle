import { widgetRegistry } from "./registry.js";
import {
  Env,
  SDurationNumber,
  SqDistributionsPlot,
  SqLinearScale,
} from "@quri/squiggle-lang";
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;
import { generateDistributionPlotSettings } from "../components/PlaygroundSettings.js";
import { DistributionsChart } from "./DistWidget/DistributionsChart.js";
import { NumberShower } from "../index.js";

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
  Preview(value) {
    const dist = value.value.toMs();
    const p05 = dist.inv(0.05);
    const p95 = dist.inv(0.95);
    const oneValue = p05 === p95;
    const show = (f: number) => {
      const unitWithValue = SDurationNumber.fromMs(f).toGreatestUnit();
      return (
        <NumberShower
          number={unitWithValue.value}
          unitName={unitWithValue.toUnitString()}
        />
      );
    };
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
    const high = value.toDist().inv(env, 0.9);
    if (high.ok) {
      const unit = SDurationNumber.fromMs(high.value).toGreatestUnit();
      const newDist = value.divideyByConstant(unit.value, env);
      // const unitString =
      const plot = SqDistributionsPlot.create({
        distribution: newDist.toDist(),
        ...generateDistributionPlotSettings(settings.distributionChartSettings),
        xScale: SqLinearScale.create({ title: unit.toUnitString() }),
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
