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
  width?: number;
  height: number;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  height,
  width,
}: DistributionChartProps) => {
  // This code with refs and effects is a bit messy, and it's because we were
  // having a large amount of trouble getting vega charts to be responsive. This
  // is the solution we ended up with
  const ref = React.useRef(null);
  const [actualWidth, setActualWidth] = React.useState(undefined);

  React.useEffect(() => {
    // @ts-ignore
    let getWidth = () => (ref.current ? ref.current.offsetWidth : 0);

    window.addEventListener("resize", () => setActualWidth(getWidth()));

    setActualWidth(getWidth());
  }, [ref.current]);

  let shape = distribution.pointSet();
  if (shape.tag === "Ok") {
    let widthProp = width ? width - 20 : actualWidth;
    console.log("widthProp", widthProp);
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
  return <div ref={ref}>{result}</div>;
};
