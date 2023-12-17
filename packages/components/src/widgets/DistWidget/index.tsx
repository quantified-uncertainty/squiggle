import { SqDistributionsPlot } from "@quri/squiggle-lang";

import { NumberShower } from "../../components/NumberShower.js";
import { generateDistributionPlotSettings } from "../../components/PlaygroundSettings.js";
import { ItemSettingsMenuItems } from "../../components/SquiggleViewer/ItemSettingsMenuItems.js";
import { formatNumber } from "../../lib/d3/index.js";
import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { unwrapOrFailure } from "../../lib/utility.js";
import { widgetRegistry } from "../registry.js";
import { DistributionsChart } from "./DistributionsChart.js";

// Distributions should be smaller than the other charts.
// Note that for distributions, this only applies to the internals, there's also extra margin and details.
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;

widgetRegistry.register("Dist", {
  Preview(value, boxed) {
    const dist = value.value;
    const environment = value.context.project.getEnvironment();
    const numberFormat = boxed?.value.numberFormat();

    const showNumber = (number: number) => {
      return numberFormat ? (
        formatNumber(numberFormat, number)
      ) : (
        <NumberShower precision={2} number={number} />
      );
    };

    const percentile05 = unwrapOrFailure(dist.inv(environment, 0.05));
    const p95 = unwrapOrFailure(dist.inv(environment, 0.95));
    const oneValue = percentile05 === p95;
    return oneValue ? (
      showNumber(percentile05)
    ) : (
      <div>
        {showNumber(percentile05)}
        <span className="mx-1 opacity-70">to</span>
        {showNumber(p95)}
      </div>
    );
  },
  Menu(value) {
    const shape = value.value.pointSet(value.context.project.getEnvironment());

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
  Chart(value, settings, boxed) {
    const numberFormat = boxed?.value.numberFormat();
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
        environment={value.context.project.getEnvironment()}
        height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
      />
    );
  },
});
