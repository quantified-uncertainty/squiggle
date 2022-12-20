import * as React from "react";
import * as yup from "yup";
import {
  resultMap,
  SqDistributionTag,
  SqPlot,
  result,
  SqDistributionError,
  SqDistribution,
  Env,
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
import { NumberShower } from "./NumberShower";
import { XIcon } from "@heroicons/react/solid";
import { Tooltip } from "./ui/Tooltip";

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

interface LabeledDistribution {
  name: string;
  distribution: SqDistribution;
  opacity: number;
}

interface Plot {
  distributions: LabeledDistribution[];
  showLegend: boolean;
  colorScheme: string;
}

export function sqPlotToPlot(sqPlot: SqPlot): Plot {
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

export const MultiDistributionChart: React.FC<MultiDistributionChartProps> = ({
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

const TableHeadCell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <th className="border border-slate-200 bg-slate-50 py-1 px-2 text-slate-500 font-semibold">
    {children}
  </th>
);

const Cell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="border border-slate-200 py-1 px-2 text-slate-900">
    {children}
  </td>
);

type SummaryTableProps = {
  plot: Plot;
  environment: Env;
};

const SummaryTable: React.FC<SummaryTableProps> = ({ plot, environment }) => {
  return (
    <table className="border border-collapse border-slate-400">
      <thead className="bg-slate-50">
        <tr>
          {plot.showLegend && <TableHeadCell>Name</TableHeadCell>}
          <TableHeadCell>{"Mean"}</TableHeadCell>
          <TableHeadCell>{"Stdev"}</TableHeadCell>
          <TableHeadCell>{"5%"}</TableHeadCell>
          <TableHeadCell>{"10%"}</TableHeadCell>
          <TableHeadCell>{"25%"}</TableHeadCell>
          <TableHeadCell>{"50%"}</TableHeadCell>
          <TableHeadCell>{"75%"}</TableHeadCell>
          <TableHeadCell>{"90%"}</TableHeadCell>
          <TableHeadCell>{"95%"}</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {plot.distributions.map((dist) => (
          <SummaryTableRow
            key={dist.name}
            distribution={dist.distribution}
            name={dist.name}
            showName={plot.showLegend}
            environment={environment}
          />
        ))}
      </tbody>
    </table>
  );
};

type SummaryTableRowProps = {
  distribution: SqDistribution;
  name: string;
  showName: boolean;
  environment: Env;
};

const SummaryTableRow: React.FC<SummaryTableRowProps> = ({
  distribution,
  name,
  showName,
  environment,
}) => {
  const mean = distribution.mean(environment);
  const stdev = distribution.stdev(environment);
  const p5 = distribution.inv(environment, 0.05);
  const p10 = distribution.inv(environment, 0.1);
  const p25 = distribution.inv(environment, 0.25);
  const p50 = distribution.inv(environment, 0.5);
  const p75 = distribution.inv(environment, 0.75);
  const p90 = distribution.inv(environment, 0.9);
  const p95 = distribution.inv(environment, 0.95);

  const unwrapResult = (
    x: result<number, SqDistributionError>
  ): React.ReactNode => {
    if (x.ok) {
      return <NumberShower number={x.value} />;
    } else {
      return (
        <Tooltip text={x.value.toString()}>
          <XIcon className="w-5 h-5 text-gray-500" />
        </Tooltip>
      );
    }
  };
  return (
    <tr>
      {showName && <Cell>{name}</Cell>}
      <Cell>
        <NumberShower number={mean} />
      </Cell>
      <Cell>{unwrapResult(stdev)}</Cell>
      <Cell>{unwrapResult(p5)}</Cell>
      <Cell>{unwrapResult(p10)}</Cell>
      <Cell>{unwrapResult(p25)}</Cell>
      <Cell>{unwrapResult(p50)}</Cell>
      <Cell>{unwrapResult(p75)}</Cell>
      <Cell>{unwrapResult(p90)}</Cell>
      <Cell>{unwrapResult(p95)}</Cell>
    </tr>
  );
};
