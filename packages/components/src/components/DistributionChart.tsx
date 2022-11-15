import * as React from "react";
import * as yup from "yup";
import {
  SqDistribution,
  result,
  SqDistributionError,
  resultMap,
  environment,
  SqDistributionTag,
} from "@quri/squiggle-lang";
import { Vega } from "react-vega";
import { ErrorAlert } from "./Alert";
import { useMeasure } from "react-use";

import {
  buildVegaSpec,
  distributionChartSpecSchema,
} from "../lib/distributionSpecBuilder";
import { NumberShower } from "./NumberShower";
import { hasMassBelowZero } from "../lib/distributionUtils";

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

export type DistributionChartProps = {
  distribution: SqDistribution;
  environment: environment;
  chartHeight?: number;
  settings: DistributionChartSettings;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  environment,
  chartHeight,
  settings,
}) => {
  const [containerRef, containerMeasure] = useMeasure<HTMLDivElement>();
  const shape = resultMap(distribution.pointSet(environment), (pointSet) =>
    pointSet.asShape()
  );

  if (shape.tag === "Error") {
    return (
      <ErrorAlert heading="Distribution Error">
        {shape.value.toString()}
      </ErrorAlert>
    );
  }

  // if this is a sample set, include the samples
  const samples: number[] = [];
  if (distribution.tag === SqDistributionTag.SampleSet) {
    samples.push(...distribution.value());
  }

  const domain = shape.value.discrete.concat(shape.value.continuous);

  const spec = buildVegaSpec({
    ...settings,
    minX: Number.isFinite(settings.minX)
      ? settings.minX
      : Math.min(...domain.map((x) => x.x)),
    maxX: Number.isFinite(settings.maxX)
      ? settings.maxX
      : Math.max(...domain.map((x) => x.x)),
    maxY: Math.max(...domain.map((x) => x.y)),
    multiplot: false,
  });

  const vegaData = { data: [shape.value], samples };

  return (
    <div ref={containerRef}>
      {
        settings.logX && hasMassBelowZero(shape.value) ? (
          <ErrorAlert heading="Log Domain Error">
            Cannot graph distribution with negative values on logarithmic scale.
          </ErrorAlert>
        ) : containerMeasure.width ? (
          <Vega
            spec={spec}
            data={vegaData}
            width={containerMeasure.width - 22}
            height={chartHeight}
            actions={settings.vegaActions}
          />
        ) : null /* width can be 0 initially or when we're on the server side; that's fine, we don't want to pre-render charts with broken width */
      }
      <div className="flex justify-center">
        {settings.showSummary && (
          <SummaryTable distribution={distribution} environment={environment} />
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
  distribution: SqDistribution;
  environment: environment;
};

const SummaryTable: React.FC<SummaryTableProps> = ({
  distribution,
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

  const hasResult = (x: result<number, SqDistributionError>): boolean =>
    x.tag === "Ok";

  const unwrapResult = (
    x: result<number, SqDistributionError>
  ): React.ReactNode => {
    if (x.tag === "Ok") {
      return <NumberShower number={x.value} />;
    } else {
      return (
        <ErrorAlert heading="Distribution Error">
          {x.value.toString()}
        </ErrorAlert>
      );
    }
  };

  return (
    <table className="border border-collapse border-slate-400">
      <thead className="bg-slate-50">
        <tr>
          <TableHeadCell>{"Mean"}</TableHeadCell>
          {hasResult(stdev) && <TableHeadCell>{"Stdev"}</TableHeadCell>}
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
        <tr>
          <Cell>{unwrapResult(mean)}</Cell>
          {hasResult(stdev) && <Cell>{unwrapResult(stdev)}</Cell>}
          <Cell>{unwrapResult(p5)}</Cell>
          <Cell>{unwrapResult(p10)}</Cell>
          <Cell>{unwrapResult(p25)}</Cell>
          <Cell>{unwrapResult(p50)}</Cell>
          <Cell>{unwrapResult(p75)}</Cell>
          <Cell>{unwrapResult(p90)}</Cell>
          <Cell>{unwrapResult(p95)}</Cell>
        </tr>
      </tbody>
    </table>
  );
};
