import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import {
  Distribution,
  result,
  distributionError,
  distributionErrorToString,
} from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as chartSpecification from "../vega-specs/spec-distributions.json";
import { ErrorBox } from "./ErrorBox";
import styled from "styled-components";

let SquiggleVegaChart = createClassFromSpec({
  spec: chartSpecification as Spec,
});

type DistributionChartProps = {
  distribution: Distribution;
  width: number;
  height: number;
  /** Whether to show a summary of means, stdev, percentiles etc */
  showSummary: boolean;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  width,
  height,
  showSummary,
}: DistributionChartProps) => {
  let shape = distribution.pointSet();
  if (shape.tag === "Ok") {
    let widthProp = width ? width - 20 : undefined;
    return (
      <>
        <SquiggleVegaChart
          data={{ con: shape.value.continuous, dis: shape.value.discrete }}
          width={widthProp}
          height={height}
          actions={false}
        />
        {showSummary ? <SummaryTable distribution={distribution} /> : <></>}
      </>
    );
  } else {
    return (
      <ErrorBox heading="Distribution Error">
        {distributionErrorToString(shape.value)}
      </ErrorBox>
    );
  }
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
