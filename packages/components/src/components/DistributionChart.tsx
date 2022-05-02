import * as React from "react";
import _ from "lodash";
import type { Spec } from "vega";
import type { Distribution } from "@quri/squiggle-lang";
import { distributionErrorToString } from "@quri/squiggle-lang";
import { createClassFromSpec } from "react-vega";
import * as chartSpecification from "../vega-specs/spec-distributions.json";
import { ErrorBox } from "./ErrorBox";
import { useSize } from 'react-use';

let SquiggleVegaChart = createClassFromSpec({
  spec: chartSpecification as Spec,
});

type DistributionChartProps = {
  distribution: Distribution;
  width?: number;
  height: number;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  height,
  width,
}: DistributionChartProps) => {

  const [sized, _] = useSize((size) => {
      let shape = distribution.pointSet();
      let widthProp = width !== undefined ? width - 20 : size.width - 10;
  if (shape.tag === "Ok") {
    return ( <div>
      <SquiggleVegaChart
        data={{ con: shape.value.continuous, dis: shape.value.discrete }}
        width={widthProp}
        height={height}
        actions={false}
      />
      </div>
      );
  } else {
      return (<div>
        <ErrorBox heading="Distribution Error">
          {distributionErrorToString(shape.value)}
        </ErrorBox>
      </div>
      )
  }
      })
      return sized;
};
