import * as React from "react";
import _ from "lodash";
import {
  Distribution,
  result,
  distributionError,
  distributionErrorToString,
} from "@quri/squiggle-lang";
import { Vega, VisualizationSpec } from "react-vega";
import * as chartSpecification from "../vega-specs/spec-distributions.json";
import { ErrorAlert } from "./Alert";
import { useSize } from "react-use";
import {
  linearXScale,
  logXScale,
  linearYScale,
  expYScale,
} from "./DistributionVegaScales";
import { NumberShower } from "./NumberShower";

type DistributionChartProps = {
  distribution: Distribution;
  width?: number;
  height: number;
  /** Whether to show a summary of means, stdev, percentiles etc */
  showSummary: boolean;
  /** Whether to show the user graph controls (scale etc) */
  showControls?: boolean;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  height,
  showSummary,
  width,
  showControls = false,
}: DistributionChartProps) => {
  let [isLogX, setLogX] = React.useState(false);
  let [isExpY, setExpY] = React.useState(false);
  let shape = distribution.pointSet();
  const [sized, _] = useSize((size) => {
    if (shape.tag === "Ok") {
      let massBelow0 =
        shape.value.continuous.some((x) => x.x <= 0) ||
        shape.value.discrete.some((x) => x.x <= 0);
      let spec = buildVegaSpec(isLogX, isExpY);
      let widthProp = width ? width : size.width;
      if (widthProp < 20) {
        console.warn(`Width of Distribution is set to ${widthProp}, which is too small`)
        widthProp = 20
      }

      // Check whether we should disable the checkbox
      var logCheckbox = (
        <CheckBox label="Log X scale" value={isLogX} onChange={setLogX} />
      );
      if (massBelow0) {
        logCheckbox = (
          <CheckBox
            label="Log X scale"
            value={isLogX}
            onChange={setLogX}
            disabled={true}
            tooltip={
              "Your distribution has mass lower than or equal to 0. Log only works on strictly positive values."
            }
          />
        );
      }

      var result = (
        <div style={{ width: widthProp + "px" }}>
          <Vega
            spec={spec}
            data={{ con: shape.value.continuous, dis: shape.value.discrete }}
            width={widthProp - 10}
            height={height}
            actions={false}
          />
          <div className="flex justify-center">
            {showSummary && <SummaryTable distribution={distribution} />}
          </div>
          {showControls && (
            <div>
              {logCheckbox}
              <CheckBox label="Exp Y scale" value={isExpY} onChange={setExpY} />
            </div>
          )}
        </div>
      );
    } else {
      var result = (
        <ErrorAlert heading="Distribution Error">
          {distributionErrorToString(shape.value)}
        </ErrorAlert>
      );
    }

    return result;
  });
  return sized;
};

function buildVegaSpec(isLogX: boolean, isExpY: boolean): VisualizationSpec {
  return {
    ...chartSpecification,
    scales: [
      isLogX ? logXScale : linearXScale,
      isExpY ? expYScale : linearYScale,
    ],
  } as VisualizationSpec;
}

interface CheckBoxProps {
  label: string;
  onChange: (x: boolean) => void;
  value: boolean;
  disabled?: boolean;
  tooltip?: string;
}

export const CheckBox = ({
  label,
  onChange,
  value,
  disabled = false,
  tooltip,
}: CheckBoxProps) => {
  return (
    <span title={tooltip}>
      <input
        type="checkbox"
        value={value + ""}
        onChange={() => onChange(!value)}
        disabled={disabled}
      />
      <label className={disabled ? "text-slate-400" : ""}> {label}</label>
    </span>
  );
};

type SummaryTableProps = {
  distribution: Distribution;
};

const SummaryTable: React.FC<SummaryTableProps> = ({
  distribution,
}: SummaryTableProps) => {
  let mean = distribution.mean();
  let p5 = distribution.inv(0.05);
  let p10 = distribution.inv(0.1);
  let p25 = distribution.inv(0.25);
  let p50 = distribution.inv(0.5);
  let p75 = distribution.inv(0.75);
  let p90 = distribution.inv(0.9);
  let p95 = distribution.inv(0.95);
  let unwrapResult = (
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

  let TableHeadCell: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => <th className="border border-slate-400 bg-slate-50 p-4">{children}</th>;
  let Cell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <td className="border border-slate-400 p-4">{children}</td>
  );

  return (
    <table className="border border-collapse border-slate-400">
      <thead className="bg-slate-50">
        <tr>
          <TableHeadCell>{"Mean"}</TableHeadCell>
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
