import { XIcon } from "@heroicons/react/solid/esm/index.js";
import { clsx } from "clsx";
import * as d3 from "d3";
import * as React from "react";
import { FC, PropsWithChildren } from "react";

import {
  Env,
  result,
  SDuration,
  SqDistributionError,
  SqDistributionsPlot,
} from "@quri/squiggle-lang";
import { TextTooltip } from "@quri/ui";

import { NumberShower } from "../../components/NumberShower.js";
import { formatDate } from "../../lib/d3/index.js";
import { useSetVerticalLine } from "./DistProvider.js";

type HoverableCellProps = PropsWithChildren<{
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}>;

const commonCellClasses = "py-0.5 px-2 font-light";

const TableHeadCell: FC<PropsWithChildren> = ({ children }) => (
  <th className={clsx(commonCellClasses)}>{children}</th>
);

const Cell: FC<HoverableCellProps> = ({
  children,
  onMouseEnter,
  onMouseLeave,
}) => (
  <td
    className={clsx(commonCellClasses, "hover:bg-blue-100")}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </td>
);

const formatNumber = (
  number: number,
  isRange: boolean,
  valueType: "date" | "number",
  tickFormat: string | undefined,
  precision: number
) => {
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
  isRange: boolean,
  valueType: "date" | "number",
  tickFormat: string | undefined,
  precision: number
): React.ReactNode => {
  if (x.ok) {
    return formatNumber(x.value, isRange, valueType, tickFormat, precision);
  } else {
    return (
      <TextTooltip text={x.value.toString()}>
        <XIcon className="w-5 h-5 text-gray-500" />
      </TextTooltip>
    );
  }
};

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
  const showNames = plot.distributions.some((d) => d.name);
  const _isDate = plot.xScale?.tag === "date";
  const valueType = _isDate ? "date" : "number";
  const tickFormat = plot.xScale?.tickFormat;
  const percentiles =
    size === "large" ? [0.05, 0.25, 0.5, 0.75, 0.95] : [0.05, 0.5, 0.95];

  const precision = size === "large" ? 3 : 2;

  const setVerticalLine = useSetVerticalLine();
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-left font-light">
        <thead
          className={clsx(
            "font-light border-b border-slate-200 text-slate-700",
            size === "large" ? "text-sm" : "text-xs"
          )}
        >
          <tr>
            {showNames && <TableHeadCell>Name</TableHeadCell>}
            <TableHeadCell>Mean</TableHeadCell>
            {size === "large" && <TableHeadCell>Stdev</TableHeadCell>}
            {percentiles.map((percentile) => (
              <TableHeadCell key={percentile}>
                {percentile * 100}%
              </TableHeadCell>
            ))}
          </tr>
        </thead>
        <tbody
          className={clsx(
            "text-sm text-blue-800 opacity-90 ",
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
                {showNames && <Cell>{name}</Cell>}
                <Cell
                  onMouseEnter={() => setVerticalLine(mean)}
                  onMouseLeave={() => setVerticalLine(undefined)}
                >
                  {formatNumber(mean, false, valueType, tickFormat, precision)}
                </Cell>
                {size === "large" && (
                  <Cell>
                    {unwrapResult(
                      stdev,
                      true,
                      valueType,
                      tickFormat,
                      precision
                    )}
                  </Cell>
                )}
                {percentileValues.map((value, i) => (
                  <Cell
                    key={i}
                    onMouseEnter={() =>
                      setVerticalLine(
                        value.inv.ok ? value.inv.value : undefined
                      )
                    }
                    onMouseLeave={() => setVerticalLine(undefined)}
                  >
                    {unwrapResult(
                      value.inv,
                      false,
                      valueType,
                      tickFormat,
                      precision
                    )}
                  </Cell>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
