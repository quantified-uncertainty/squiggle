import {
  Env,
  SqDistribution,
  SqDistributionsPlot,
  SqScale,
} from "@quri/squiggle-lang";

import { generateDistributionPlotSettings } from "../../components/PlaygroundSettings.js";
import { ItemSettingsMenuItems } from "../../components/SquiggleViewer/ItemSettingsMenuItems.js";
import { NumberShower } from "../../components/ui/NumberShower.js";
import { formatNumber } from "../../lib/d3/index.js";
import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { unwrapOrFailure } from "../../lib/utility.js";
import { widgetRegistry } from "../registry.js";
import { DistributionsChart } from "./DistributionsChart.js";

// Distributions should be smaller than the other charts.
// Note that for distributions, this only applies to the internals, there's also extra margin and details.
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.55;

function getDistributionInfo(dist: SqDistribution, environment: Env) {
  const p05 = unwrapOrFailure(dist.inv(environment, 0.05));
  const p95 = unwrapOrFailure(dist.inv(environment, 0.95));
  const oneValue = p05 === p95;
  return { p05, p95, oneValue };
}

widgetRegistry.register("Dist", {
  Preview(value) {
    const dist = value.value;
    const environment = value.context.runContext.environment;
    const numberFormat = value.tags.numberFormat();

    const showNumber = (number: number) => {
      return numberFormat ? (
        formatNumber(numberFormat, number)
      ) : (
        <NumberShower precision={2} number={number} />
      );
    };

    const { p05, p95, oneValue } = getDistributionInfo(dist, environment);

    return oneValue ? (
      showNumber(p05)
    ) : (
      <div className="flex flex-row items-center space-x-2">
        <div className="flex">
          {showNumber(p05)}
          <span className="mx-1.5 text-slate-400">to</span>
          {showNumber(p95)}
        </div>
      </div>
    );
  },
  PreviewRightSide(value) {
    const dist = value.value;
    const environment = value.context.runContext.environment;
    const { oneValue } = getDistributionInfo(dist, environment);

    const distPlot = value.showAsPlot();
    const plot = SqDistributionsPlot.create({
      distribution: value.value,
      showSummary: false,
      xScale: distPlot?.xScale ?? SqScale.linearDefault(),
      yScale: distPlot?.yScale ?? SqScale.linearDefault(),
    });
    return (
      !oneValue && (
        <DistributionsChart
          plot={plot}
          environment={value.context.runContext.environment}
          height={14}
        />
      )
    );
  },
  Menu(value) {
    const shape = value.value.pointSet(value.context.runContext.environment);

    return (
      <ItemSettingsMenuItems
        value={value}
        metaSettings={{
          disableLogX: shape?.ok && hasMassBelowZero(shape.value.asShape()),
        }}
        withFunctionSettings={false}
      />
    );
  },
  Chart(value, settings) {
    const numberFormat = value.tags.numberFormat();
    const plot = SqDistributionsPlot.create({
      distribution: value.value,
      ...generateDistributionPlotSettings(
        settings.distributionChartSettings,
        numberFormat
      ),
    });

    return (
      <DistributionsChart
        plot={plot}
        environment={value.context.runContext.environment}
        height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
      />
    );
  },
});
