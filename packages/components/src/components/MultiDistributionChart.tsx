import * as React from "react";
import * as yup from "yup";
import {
  resultMap,
  SqRecord,
  SqDistributionTag,
  environment,
} from "@quri/squiggle-lang";
import { Vega } from "react-vega";
import { ErrorAlert } from "./Alert";
import { useMeasure } from "react-use";
import {
  buildVegaSpec,
  distributionChartSpecSchema,
} from "../lib/distributionSpecBuilder";
import { flattenResult } from "../lib/utility";
import { hasMassBelowZero } from "../lib/distributionUtils";
import { Plot, parsePlot, LabeledDistribution } from "../lib/plotParser";

export const distributionSettingsSchema = yup
  .object({})
  .shape({
    showSummary: yup.boolean().required().default(false),
    vegaActions: yup.boolean().required().default(false),
  })
  .concat(distributionChartSpecSchema);

export type DistributionChartSettings = yup.InferType<
  typeof distributionSettingsSchema
>;

export function makePlot(record: SqRecord): Plot | void {
  const plotResult = parsePlot(record);
  if (plotResult.tag === "Ok") {
    return plotResult.value;
  }
}

export type MultiDistributionChartProps = {
  plot: Plot;
  environment: environment;
  chartHeight?: number;
  settings: DistributionChartSettings;
};

export const MultiDistributionChart: React.FC<MultiDistributionChartProps> = ({
  plot,
  environment,
  chartHeight,
  settings,
}) => {
  const [containerRef, containerMeasure] = useMeasure<HTMLDivElement>();

  const distributions: LabeledDistribution[] = plot.distributions;

  let shapes = flattenResult(
    distributions.map((x) =>
      resultMap(x.distribution.pointSet(environment), (pointSet) => ({
        name: x.name,
        opacity: x.opacity,
        ...pointSet.asShape(),
      }))
    )
  );

  if (shapes.tag === "Error") {
    return (
      <ErrorAlert heading="Distribution Error">
        {shapes.value.toString()}
      </ErrorAlert>
    );
  }

  // if this is a sample set, include the samples
  const samples: number[] = [];
  for (const { distribution } of distributions) {
    if (distribution.tag === SqDistributionTag.SampleSet) {
      samples.push(...distribution.value());
    }
  }

  const domain = shapes.value.flatMap((shape) =>
    shape.discrete.concat(shape.continuous)
  );

  const spec = buildVegaSpec({
    ...settings,
    minX: Number.isFinite(settings.minX)
      ? settings.minX
      : Math.min(...domain.map((x) => x.x)),
    maxX: Number.isFinite(settings.maxX)
      ? settings.maxX
      : Math.max(...domain.map((x) => x.x)),
    maxY: Math.max(...domain.map((x) => x.y)),
    colorScheme: plot.colorScheme,
    showLegend: plot.showLegend,
  });

  const vegaData = { data: shapes.value, samples };

  return (
    <div ref={containerRef}>
      {settings.logX && shapes.value.some(hasMassBelowZero) ? (
        <ErrorAlert heading="Log Domain Error">
          Cannot graph distribution with negative values on logarithmic scale.
        </ErrorAlert>
      ) : (
        <Vega
          spec={spec}
          data={vegaData}
          width={containerMeasure.width - 22}
          height={chartHeight}
          actions={settings.vegaActions}
        />
      )}
    </div>
  );
};
