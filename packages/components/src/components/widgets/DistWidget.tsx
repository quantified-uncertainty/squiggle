import { SqDistributionsPlot } from "@quri/squiggle-lang";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { DistPreview } from "../DistributionsChart/DistPreview.js";
import { DistributionsChart } from "../DistributionsChart/index.js";
import { generateDistributionPlotSettings } from "../PlaygroundSettings.js";
import { ItemSettingsMenu } from "../SquiggleViewer/ItemSettingsMenu.js";
import { widgetRegistry } from "./registry.js";

// Distributions should be smaller than the other charts.
// Note that for distributions, this only applies to the internals, there's also extra margin and details.
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;

widgetRegistry.register("Dist", {
  renderPreview: (value) => (
    <DistPreview
      dist={value.value}
      environment={value.context.project.getEnvironment()}
    />
  ),
  renderSettingsMenu: (value, { onChange }) => {
    const shape = value.value.pointSet(value.context.project.getEnvironment());

    return (
      <ItemSettingsMenu
        value={value}
        onChange={onChange}
        metaSettings={{
          disableLogX: shape?.ok && hasMassBelowZero(shape.value.asShape()),
        }}
        withFunctionSettings={false}
      />
    );
  },
  render: (value, settings) => {
    const plot = SqDistributionsPlot.create({
      distribution: value.value,
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
