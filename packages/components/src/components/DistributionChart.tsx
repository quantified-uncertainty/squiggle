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
import { ErrorBox } from "./ErrorBox";
import { useSize } from "react-use";
import {
  linearXScale,
  logXScale,
  linearYScale,
  expYScale,
} from "./DistributionVegaScales";
import styled from "styled-components";

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
      let widthProp = width ? width - 20 : size.width - 10;

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
        <div>
          <Vega
            spec={spec}
            data={{ con: shape.value.continuous, dis: shape.value.discrete }}
            width={widthProp}
            height={height}
            actions={false}
          />
          {showSummary && <SummaryTable distribution={distribution} />}
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
        <ErrorBox heading="Distribution Error">
          {distributionErrorToString(shape.value)}
        </ErrorBox>
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

const Label = styled.label<{ disabled: boolean }>`
  ${(props) => props.disabled && "color: #999;"}
`;

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
      <Label disabled={disabled}>{label}</Label>
    </span>
  );
};

type SummaryTableProps = {
  distribution: Distribution;
};

const Table = styled.table``;
const Row = styled.tr``;
const Cell = styled.td``;
const TableHeader = styled.th``;

const SummaryTable: React.FC<SummaryTableProps> = ({
  distribution,
}: SummaryTableProps) => {
  let mean = distribution.mean();
  let median = distribution.inv(0.5);
  let p5 = distribution.inv(0.05);
  let p10 = distribution.inv(0.1);
  let Q1 = distribution.inv(0.25);
  let Q3 = distribution.inv(0.75);
  let p90 = distribution.inv(0.9);
  let p95 = distribution.inv(0.95);
  let unwrapResult = (
    x: result<number, distributionError>
  ): React.ReactNode => {
    if (x.tag === "Ok") {
      return (
        <span>
          {Intl.NumberFormat("en-US", { maximumSignificantDigits: 3 }).format(
            x.value
          )}
        </span>
      );
    } else {
      return (
        <ErrorBox heading="Distribution Error">
          {distributionErrorToString(x.value)}
        </ErrorBox>
      );
    }
  };

  return (
    <Table>
      <Row>
        <TableHeader>{"Mean"}</TableHeader>
        <TableHeader>{"5%"}</TableHeader>
        <TableHeader>{"10%"}</TableHeader>
        <TableHeader>{"Q1 (25%)"}</TableHeader>
        <TableHeader>{"Median (50%)"}</TableHeader>
        <TableHeader>{"Q3 (75%)"}</TableHeader>
        <TableHeader>{"90%"}</TableHeader>
        <TableHeader>{"95%"}</TableHeader>
      </Row>
      <Row>
        <Cell>{unwrapResult(mean)}</Cell>
        <Cell>{unwrapResult(p5)}</Cell>
        <Cell>{unwrapResult(p10)}</Cell>
        <Cell>{unwrapResult(Q1)}</Cell>
        <Cell>{unwrapResult(median)}</Cell>
        <Cell>{unwrapResult(Q3)}</Cell>
        <Cell>{unwrapResult(p90)}</Cell>
        <Cell>{unwrapResult(p95)}</Cell>
      </Row>
    </Table>
  );
};
