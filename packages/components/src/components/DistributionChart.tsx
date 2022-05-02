import * as React from "react";
import _ from "lodash";
import type { Distribution } from "@quri/squiggle-lang";
import { distributionErrorToString, result, shape } from "@quri/squiggle-lang";
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
    let [isLogX, setLogX] = React.useState(false);
    let [isExpY, setExpY] = React.useState(false);
    let shape = distribution.pointSet();
    if (shape.tag === "Ok") {
      let spec = buildSpec(isLogX, isExpY, shape.value);
      if (spec.tag == "Ok") {
        let widthProp = width ? width - 20 : size.width - 10;
        var result = (
          <div>
            <Vega
              spec={spec.value}
              data={{ con: shape.value.continuous, dis: shape.value.discrete }}
              width={widthProp}
              height={height}
              actions={false}
            />
          </div>
        );
      } else {
        var result = (
          <ErrorBox heading={spec.value.heading}>{spec.value.error}</ErrorBox>
        );
      }
    } else {
      var result = (
        <ErrorBox heading="Distribution Error">
          {distributionErrorToString(shape.value)}
        </ErrorBox>
      );
    }
    return (
      <>
        {result}
        <div>
          <CheckBox label="Log X scale" value={isLogX} onChange={setLogX} />
          <CheckBox label="Exp Y scale" value={isExpY} onChange={setExpY} />
        </div>
      </>
    );
  });
  return sized;
};

type ViewError = { heading: string; error: string };

function buildSpec(
  isLogX: boolean,
  isExpY: boolean,
  shape: shape
): result<VisualizationSpec, ViewError> {
  let someBelow0 =
    shape.continuous.some((x) => x.x <= 0) ||
    shape.discrete.some((x) => x.x <= 0);
  if (!(isLogX && someBelow0)) {
    return {
      tag: "Ok",
      value: {
        ...chartSpecification,
        scales: [
          isLogX ? logXScale : linearXScale,
          isExpY ? expYScale : linearYScale,
        ],
      } as VisualizationSpec,
    };
  } else {
    return {
      tag: "Error",
      value: {
        heading: "Log Viewing error",
        error:
          "Distribution contains values lower than or equal to 0. Cannot view",
      },
    };
  }
}

export const CheckBox = ({ label, onChange, value }) => {
  return (
    <span>
      <input type="checkbox" value={value} onChange={() => onChange(!value)} />
      <label>{label}</label>
    </span>
  );
};
