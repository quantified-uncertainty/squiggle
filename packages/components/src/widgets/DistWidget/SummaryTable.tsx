import * as React from "react";
import { FC, PropsWithChildren } from "react";
import * as d3 from "d3";

import { XIcon } from "@heroicons/react/solid/esm/index.js";
import {
  Env,
  result,
  SDuration,
  SqDistribution,
  SqDistributionError,
  SqDistributionsPlot,
} from "@quri/squiggle-lang";
import { TextTooltip } from "@quri/ui";

import { NumberShower } from "../../components/NumberShower.js";
import { useSetVerticalLine } from "./DistProvider.js";
import { clsx } from "clsx";

type HoverableCellProps = PropsWithChildren<{
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}>;

const commonCellClasses =
  "border border-slate-200 py-1 px-2 text-slate-700 font-light";
import { DEFAULT_DATE_FORMAT } from "../../lib/constants.js";

const TableHeadCell: FC<PropsWithChildren> = ({ children }) => (
  <th className={clsx(commonCellClasses, "text-xs")}>{children}</th>
);

const Cell: FC<HoverableCellProps> = ({
  children,
  onMouseEnter,
  onMouseLeave,
}) => (
  <td
    className={clsx(commonCellClasses, "text-sm")}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </td>
);

type SummaryTableRowProps = {
  distribution: SqDistribution;
  name: string;
  showName: boolean;
  environment: Env;
  tickFormat: string | undefined;
  valueType: "date" | "number";
};

const percentiles = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95];

const SummaryTableRow: FC<SummaryTableRowProps> = ({
  distribution,
  name,
  showName,
  environment,
  tickFormat,
  valueType,
}) => {
  const mean = distribution.mean(environment);
  const stdev = distribution.stdev(environment);

  const percentileValues = percentiles.map((percentile) =>
    distribution.inv(environment, percentile)
  );

  const formatNumber = (number: number, isRange: boolean) => {
    if (valueType == "date") {
      // When dealing with dates, the standard deviation is a duration, not a date, so we need to format it differently
      if (isRange) {
        return SDuration.fromMs(number).toString();
      } else {
        return d3.timeFormat(tickFormat ?? DEFAULT_DATE_FORMAT)(
          new Date(number)
        );
      }
    } else if (tickFormat) {
      return d3.format(tickFormat)(number);
    } else {
      return <NumberShower number={number} precision={3} />;
    }
  };

  const unwrapResult = (
    x: result<number, SqDistributionError>,
    isRange: boolean
  ): React.ReactNode => {
    if (x.ok) {
      return formatNumber(x.value, isRange);
    } else {
      return (
        <TextTooltip text={x.value.toString()}>
          <XIcon className="w-5 h-5 text-gray-500" />
        </TextTooltip>
      );
    }
  };

  const setVerticalLine = useSetVerticalLine();

  return (
    <tr>
      {showName && <Cell>{name}</Cell>}
      <Cell
        onMouseEnter={() => setVerticalLine(mean)}
        onMouseLeave={() => setVerticalLine(undefined)}
      >
        {formatNumber(mean, false)}
      </Cell>
      <Cell>{unwrapResult(stdev, true)}</Cell>
      {percentileValues.map((value, i) => (
        <Cell
          key={i}
          onMouseEnter={() =>
            setVerticalLine(value.ok ? value.value : undefined)
          }
          onMouseLeave={() => setVerticalLine(undefined)}
        >
          {unwrapResult(value, false)}
        </Cell>
      ))}
    </tr>
  );
};

type SummaryTableProps = {
  plot: SqDistributionsPlot;
  environment: Env;
};

export const SummaryTable: FC<SummaryTableProps> = ({ plot, environment }) => {
  const showNames = plot.distributions.some((d) => d.name);
  const isDate = plot.xScale?.tag === "date";
  const tickFormat = plot.xScale?.tickFormat;

  return (
    <table className="table border border-collapse border-slate-400">
      <thead className="bg-slate-50">
        <tr>
          {showNames && <TableHeadCell>Name</TableHeadCell>}
          <TableHeadCell>Mean</TableHeadCell>
          <TableHeadCell>Stdev</TableHeadCell>
          {percentiles.map((percentile) => (
            <TableHeadCell key={percentile}>{percentile * 100}%</TableHeadCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {plot.distributions.map((dist, i) => (
          <SummaryTableRow
            key={i} // dist.name doesn't have to be unique, so we can't use it as a key
            distribution={dist.distribution}
            name={dist.name ?? dist.distribution.toString()}
            showName={showNames}
            environment={environment}
            tickFormat={tickFormat}
            valueType={isDate ? "date" : "number"}
          />
        ))}
      </tbody>
    </table>
  );
};
