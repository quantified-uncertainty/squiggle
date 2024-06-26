import { XIcon } from "@heroicons/react/solid/esm/index.js";
import { clsx } from "clsx";
import * as d3 from "d3";
import * as React from "react";
import { FC, PropsWithChildren } from "react";

import {
  Env,
  result,
  SDuration,
  SqDistribution,
  SqDistributionError,
  SqDistributionsPlot,
  SqSampleSetDistribution,
} from "@quri/squiggle-lang";
import { TextTooltip } from "@quri/ui";

import { NumberShower } from "../../components/ui/NumberShower.js";
import { formatDate } from "../../lib/d3/index.js";
import { useSetSelectedVerticalLine } from "./DistProvider.js";

type HoverableCellProps = PropsWithChildren<{
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  hoverable?: boolean;
  isTitle?: boolean;
}>;

const commonCellClasses = "py-0.5 px-2";

const TableHeadCell: FC<PropsWithChildren> = ({ children }) => (
  <th className={clsx(commonCellClasses, "font-light")}>{children}</th>
);

const Cell: FC<HoverableCellProps> = ({
  children,
  onMouseEnter,
  onMouseLeave,
  hoverable = true,
  isTitle = false,
}) => (
  <td
    className={clsx(
      commonCellClasses,
      isTitle ? "font-medium" : "font-light",
      hoverable && "hover:bg-blue-100"
    )}
    onMouseEnter={hoverable ? onMouseEnter : undefined}
    onMouseLeave={hoverable ? onMouseLeave : undefined}
  >
    {children}
  </td>
);

type SummaryTableProps = {
  plot: SqDistributionsPlot;
  environment: Env;
  size?: "small" | "large";
};

export const SummaryTable: FC<SummaryTableProps> = ({
  plot,
  environment,
  size,
}) => {
  const setSelectedVerticalLine = useSetSelectedVerticalLine();
  const showNames = plot.distributions.some((d) => d.name);
  const isDate = plot.xScale?.method?.type === "date";
  const valueType = isDate ? "date" : "number";
  const tickFormat = plot.xScale?.tickFormat;
  const sizeIsLarge = size === "large";
  const percentiles = sizeIsLarge
    ? [0.05, 0.25, 0.5, 0.75, 0.95]
    : [0.05, 0.5, 0.95];

  const getSampleCount = (dist: SqDistribution) => {
    return dist instanceof SqSampleSetDistribution && dist.getSamples().length;
  };
  const _firstSamples = getSampleCount(plot.distributions[0].distribution);

  const _hasSamples = Boolean(_firstSamples && _firstSamples > 5);
  const showSamplesCount = _hasSamples && sizeIsLarge;

  const precision = sizeIsLarge ? 3 : 2;

  const formatNumber = (number: number, isRange: boolean) => {
    if (valueType == "date") {
      // When dealing with dates, the standard deviation is a duration, not a date, so we need to format it differently
      if (isRange) {
        return SDuration.fromMs(number).toString();
      } else {
        return formatDate(new Date(number), tickFormat);
      }
    } else if (tickFormat) {
      return d3.format(tickFormat)(number);
    } else {
      return <NumberShower number={number} precision={precision} />;
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
          <XIcon className="h-5 w-5 text-gray-500" />
        </TextTooltip>
      );
    }
  };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left font-light">
        <thead
          className={clsx(
            "border-b border-slate-200 font-light text-slate-700",
            sizeIsLarge ? "text-sm" : "text-xs"
          )}
        >
          <tr>
            {showNames && <TableHeadCell>Name</TableHeadCell>}
            <TableHeadCell>Mean</TableHeadCell>
            {sizeIsLarge && <TableHeadCell>Stdev</TableHeadCell>}
            {percentiles.map((percentile) => (
              <TableHeadCell key={percentile}>
                {percentile * 100}%
              </TableHeadCell>
            ))}
            {showSamplesCount && <TableHeadCell>Samples</TableHeadCell>}
          </tr>
        </thead>
        <tbody
          className={clsx(
            "text-sm text-blue-800 opacity-90",
            size === "large" ? "text-md" : "text-sm"
          )}
        >
          {plot.distributions.map((dist, i) => {
            const distribution = dist.distribution;
            const name = dist.name ?? dist.distribution.toString();
            const mean = distribution.mean(environment);
            const stdev = distribution.stdev(environment);

            const percentileValues = percentiles.map((percentile) => ({
              percentile,
              inv: distribution.inv(environment, percentile),
            }));
            return (
              <tr key={i}>
                {showNames && (
                  <Cell hoverable={false} isTitle>
                    {name}
                  </Cell>
                )}
                <Cell
                  onMouseEnter={() => setSelectedVerticalLine(mean)}
                  onMouseLeave={() => setSelectedVerticalLine(undefined)}
                >
                  {formatNumber(mean, false)}
                </Cell>
                {sizeIsLarge && <Cell>{unwrapResult(stdev, true)}</Cell>}
                {percentileValues.map((value, i) => (
                  <Cell
                    key={i}
                    hoverable={value.inv.ok}
                    onMouseEnter={() =>
                      setSelectedVerticalLine(
                        value.inv.ok ? value.inv.value : undefined
                      )
                    }
                    onMouseLeave={() => setSelectedVerticalLine(undefined)}
                  >
                    {unwrapResult(value.inv, false)}
                  </Cell>
                ))}
                {showSamplesCount && (
                  <Cell hoverable={false}>{getSampleCount(distribution)}</Cell>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
