import * as React from "react";
import {
  Distribution,
  result,
  distributionError,
  distributionErrorToString,
  squiggleExpression,
  resultMap,
} from "@quri/squiggle-lang";
import { Vega } from "react-vega";
import { ErrorAlert } from "./Alert";
import { useSize } from "react-use";
import clsx from "clsx";

import {
  buildVegaSpec,
  DistributionChartSpecOptions,
} from "../lib/distributionSpecBuilder";
import { NumberShower } from "./NumberShower";
import { Plot, parsePlot } from "../lib/plotting";
import { flattenResult, all } from "../lib/utility";

export type DistributionPlottingSettings = {
  /** Whether to show a summary of means, stdev, percentiles etc */
  showSummary: boolean;
  /** Whether to show the user graph controls (scale etc) */
  showControls: boolean;
} & DistributionChartSpecOptions;

export type DistributionChartProps = {
  plot: Plot;
  width?: number;
  height: number;
  actions?: boolean;
} & DistributionPlottingSettings;

export function defaultPlot(distribution: Distribution): Plot {
  return { distributions: [{ name: "default", distribution }] };
}

export function makePlot(record: {
  [key: string]: squiggleExpression;
}): Plot | void {
  const plotResult = parsePlot(record);
  if (plotResult.tag == "Ok") {
    return plotResult.value;
  }
}

export const DistributionChart: React.FC<DistributionChartProps> = (props) => {
  const {
    plot,
    height,
    showSummary,
    width,
    showControls,
    logX,
    expY,
    actions = false,
  } = props;
  const [isLogX, setLogX] = React.useState(logX);
  const [isExpY, setExpY] = React.useState(expY);

  React.useEffect(() => setLogX(logX), [logX]);
  React.useEffect(() => setExpY(expY), [expY]);

  const [sized] = useSize((size) => {
    let shapes = flattenResult(
      plot.distributions.map((x) =>
        resultMap(x.distribution.pointSet(), (shape) => ({
          name: x.name,
          continuous: shape.continuous,
          discrete: shape.discrete,
        }))
      )
    );
    if (shapes.tag === "Error") {
      return (
        <ErrorAlert heading="Distribution Error">
          {distributionErrorToString(shapes.value)}
        </ErrorAlert>
      );
    }

    const massBelow0 = all(
      shapes.value.map(
        (shape) =>
          shape.continuous.some((x) => x.x <= 0) ||
          shape.discrete.some((x) => x.x <= 0)
      )
    );
    const spec = buildVegaSpec(props);

    let widthProp = width ? width : size.width;
    if (widthProp < 20) {
      console.warn(
        `Width of Distribution is set to ${widthProp}, which is too small`
      );
      widthProp = 20;
    }
    const domain = shapes.value.flatMap((shape) =>
      shape.discrete.concat(shape.continuous)
    );

    return (
      <div style={{ width: widthProp }}>
        {!(isLogX && massBelow0) ? (
          <Vega
            spec={spec}
            data={{ data: shapes.value, domain }}
            width={widthProp - 10}
            height={height}
            actions={actions}
          />
        ) : (
          <ErrorAlert heading="Log Domain Error">
            Cannot graph distribution with negative values on logarithmic scale.
          </ErrorAlert>
        )}
        <div className="flex justify-center">
          {showSummary && plot.distributions.length == 1 && (
            <SummaryTable distribution={plot.distributions[0].distribution} />
          )}
        </div>
        {showControls && (
          <div>
            <CheckBox
              label="Log X scale"
              value={isLogX}
              onChange={setLogX}
              // Check whether we should disable the checkbox
              {...(massBelow0
                ? {
                    disabled: true,
                    tooltip:
                      "Your distribution has mass lower than or equal to 0. Log only works on strictly positive values.",
                  }
                : {})}
            />
            <CheckBox label="Exp Y scale" value={isExpY} onChange={setExpY} />
          </div>
        )}
      </div>
    );
  });
  return sized;
};

interface CheckBoxProps {
  label: string;
  onChange: (x: boolean) => void;
  value: boolean;
  disabled?: boolean;
  tooltip?: string;
}

export const CheckBox: React.FC<CheckBoxProps> = ({
  label,
  onChange,
  value,
  disabled = false,
  tooltip,
}) => {
  return (
    <span title={tooltip}>
      <input
        type="checkbox"
        checked={value}
        onChange={() => onChange(!value)}
        disabled={disabled}
        className="form-checkbox"
      />
      <label className={clsx(disabled && "text-slate-400")}> {label}</label>
    </span>
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
  distribution: Distribution;
};

const SummaryTable: React.FC<SummaryTableProps> = ({ distribution }) => {
  const mean = distribution.mean();
  const stdev = distribution.stdev();
  const p5 = distribution.inv(0.05);
  const p10 = distribution.inv(0.1);
  const p25 = distribution.inv(0.25);
  const p50 = distribution.inv(0.5);
  const p75 = distribution.inv(0.75);
  const p90 = distribution.inv(0.9);
  const p95 = distribution.inv(0.95);

  const hasResult = (x: result<number, distributionError>): boolean =>
    x.tag === "Ok";

  const unwrapResult = (
    x: result<number, distributionError>
  ): React.ReactNode => {
    if (x.tag === "Ok") {
      return <NumberShower number={x.value} />;
    } else {
      return (
        <ErrorAlert heading="Distribution Error">
          {distributionErrorToString(x.value)}
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
