import { Env, resultMap, SqDistributionTag } from "@quri/squiggle-lang";
import { SqDistributionsPlot } from "@quri/squiggle-lang/src/public/SqPlot";
import * as React from "react";
import { FC } from "react";
import { useMeasure } from "react-use";
import { Vega } from "react-vega";
import * as yup from "yup";
import {
  buildVegaSpec,
  distributionChartSpecSchema,
} from "../../lib/distributionSpecBuilder";
import { hasMassBelowZero } from "../../lib/distributionUtils";
import { flattenResult } from "../../lib/utility";
import { ErrorAlert } from "../Alert";
import { SummaryTable } from "./SummaryTable";
import { Plot } from "./types";

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

export function sqPlotToPlot(sqPlot: SqDistributionsPlot): Plot {
  return {
    distributions: sqPlot.distributions.map((x) => ({ ...x, opacity: 0.3 })),
    colorScheme: "category10",
    showLegend: true,
  };
}

export type MultiDistributionChartProps = {
  plot: Plot;
  environment: Env;
  chartHeight?: number;
  settings: DistributionChartSettings;
};

export const MultiDistributionChart: FC<MultiDistributionChartProps> = ({
  plot,
  environment,
  chartHeight,
  settings,
}) => {
  const [containerRef, containerMeasure] = useMeasure<HTMLDivElement>();

  const distributions = plot.distributions;

  let shapes = flattenResult(
    distributions.map((x) =>
      resultMap(x.distribution.pointSet(environment), (pointSet) => ({
        name: x.name,
        opacity: x.opacity,
        ...pointSet.asShape(),
      }))
    )
  );

  if (!shapes.ok) {
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
      samples.push(...distribution.value().samples);
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
        <figure>
          {
            containerMeasure.width ? (
              <Vega
                spec={spec}
                data={vegaData}
                width={containerMeasure.width - 22}
                height={chartHeight}
                actions={settings.vegaActions}
              />
            ) : null /* width can be 0 initially or when we're on the server side; that's fine, we don't want to pre-render charts with broken width */
          }{" "}
        </figure>
      )}
      <div className="flex justify-center">
        {settings.showSummary && (
          <SummaryTable plot={plot} environment={environment} />
        )}
      </div>
    </div>
  );
};
