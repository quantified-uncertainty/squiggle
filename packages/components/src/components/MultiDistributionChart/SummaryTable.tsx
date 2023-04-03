import * as React from "react";
import { FC, PropsWithChildren } from "react";

import { XIcon } from "@heroicons/react/solid/esm/index.js";
import {
  Env,
  result,
  SqDistribution,
  SqDistributionError,
} from "@quri/squiggle-lang";
import { NumberShower } from "../NumberShower.js";
import { Tooltip } from "../ui/Tooltip.js";
import { Plot } from "./types.js";

const TableHeadCell: FC<PropsWithChildren> = ({ children }) => (
  <th className="border border-slate-200 bg-slate-50 py-1 px-2 text-slate-500 font-semibold">
    {children}
  </th>
);

const Cell: FC<PropsWithChildren> = ({ children }) => (
  <td className="border border-slate-200 py-1 px-2 text-slate-900">
    {children}
  </td>
);

type SummaryTableRowProps = {
  distribution: SqDistribution;
  name: string;
  showName: boolean;
  environment: Env;
};

const percentiles = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95];

const SummaryTableRow: FC<SummaryTableRowProps> = ({
  distribution,
  name,
  showName,
  environment,
}) => {
  const mean = distribution.mean(environment);
  const stdev = distribution.stdev(environment);

  const percentileValues = percentiles.map((percentile) =>
    distribution.inv(environment, percentile)
  );

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
      {percentileValues.map((value, i) => (
        <Cell key={i}>{unwrapResult(value)}</Cell>
      ))}
    </tr>
  );
};

type SummaryTableProps = {
  plot: Plot;
  environment: Env;
};

export const SummaryTable: FC<SummaryTableProps> = ({ plot, environment }) => {
  return (
    <table className="border border-collapse border-slate-400">
      <thead className="bg-slate-50">
        <tr>
          {plot.showLegend && <TableHeadCell>Name</TableHeadCell>}
          <TableHeadCell>Mean</TableHeadCell>
          <TableHeadCell>Stdev</TableHeadCell>
          {percentiles.map((percentile) => (
            <TableHeadCell key={percentile}>{percentile * 100}%</TableHeadCell>
          ))}
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
