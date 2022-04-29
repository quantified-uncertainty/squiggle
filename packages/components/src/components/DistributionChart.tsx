import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import type { Distribution } from "@quri/squiggle-lang";
import { distributionErrorToString } from "@quri/squiggle-lang";
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
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  width,
  height,
}: DistributionChartProps) => {
  let shape = distribution.pointSet();
  if (shape.tag === "Ok") {
    let widthProp = width ? width - 20 : undefined;
    var result = (
      <SquiggleVegaChart
        data={{ con: shape.value.continuous, dis: shape.value.discrete }}
        width={widthProp}
        height={height}
        actions={false}
      />
    );
  } else {
    var result = (
      <ErrorBox heading="Distribution Error">
        {distributionErrorToString(shape.value)}
      </ErrorBox>
    );
  }
  return result;
};
