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
        <ChartContainer width={widthProp + "px"}>
          <Vega
            spec={spec}
            data={{ con: shape.value.continuous, dis: shape.value.discrete }}
            width={widthProp - 10}
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
        </ChartContainer>
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

type ChartContainerProps = { width: string };

let ChartContainer = styled.div<ChartContainerProps>`
  width: ${(props) => props.width};
`;

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

const Table = styled.table`
  margin-left: auto;
  margin-right: auto;
  border-collapse: collapse;
  text-align: center;
  border-style: hidden;
`;

const TableHead = styled.thead`
  border-bottom: 1px solid rgb(141 149 167);
`;

const TableHeadCell = styled.th`
  border-right: 1px solid rgb(141 149 167);
  border-left: 1px solid rgb(141 149 167);
  padding: 0.3em;
`;

const TableBody = styled.tbody``;

const Row = styled.tr``;

const Cell = styled.td`
  padding: 0.3em;
  border-right: 1px solid rgb(141 149 167);
  border-left: 1px solid rgb(141 149 167);
`;

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
        <ErrorBox heading="Distribution Error">
          {distributionErrorToString(x.value)}
        </ErrorBox>
      );
    }
  };

  return (
    <Table>
      <TableHead>
        <Row>
          <TableHeadCell>{"Mean"}</TableHeadCell>
          <TableHeadCell>{"5%"}</TableHeadCell>
          <TableHeadCell>{"10%"}</TableHeadCell>
          <TableHeadCell>{"25%"}</TableHeadCell>
          <TableHeadCell>{"50%"}</TableHeadCell>
          <TableHeadCell>{"75%"}</TableHeadCell>
          <TableHeadCell>{"90%"}</TableHeadCell>
          <TableHeadCell>{"95%"}</TableHeadCell>
        </Row>
      </TableHead>
      <TableBody>
        <Row>
          <Cell>{unwrapResult(mean)}</Cell>
          <Cell>{unwrapResult(p5)}</Cell>
          <Cell>{unwrapResult(p10)}</Cell>
          <Cell>{unwrapResult(p25)}</Cell>
          <Cell>{unwrapResult(p50)}</Cell>
          <Cell>{unwrapResult(p75)}</Cell>
          <Cell>{unwrapResult(p90)}</Cell>
          <Cell>{unwrapResult(p95)}</Cell>
        </Row>
      </TableBody>
    </Table>
  );
};
