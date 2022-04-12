import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import type { Distribution } from "@quri/squiggle-lang";
import { distributionErrorToString } from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as chartSpecification from "../vega-specs/spec-distributions.json";
import { ErrorBox } from "./ErrorBox";

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
    return (
      <SquiggleVegaChart
        data={{ con: shape.value.continuous, dis: shape.value.discrete }}
        width={width}
        height={height}
        actions={false}
      />
    );
  } else {
    return (
      <ErrorBox heading="Distribution Error">
        {distributionErrorToString(shape.value)}
      </ErrorBox>
    );
  }
};
