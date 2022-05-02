import * as React from "react";
import _ from "lodash";
import type { Distribution } from "@quri/squiggle-lang";
import { distributionErrorToString } from "@quri/squiggle-lang";
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
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  height,
  width,
}: DistributionChartProps) => {
  let [isLogX, setLogX] = React.useState(false);
  let [isExpY, setExpY] = React.useState(false);
  let shape = distribution.pointSet();
  const [sized, _] = useSize((size) => {
    var disableLog = false;
    if (shape.tag === "Ok") {
      let massBelow0 =
        shape.value.continuous.some((x) => x.x <= 0) ||
        shape.value.discrete.some((x) => x.x <= 0);
      if (massBelow0) {
        disableLog = true;
      }
      let spec = buildVegaSpec(isLogX, isExpY);
      let widthProp = width ? width - 20 : size.width - 10;
      var result = (
        <div>
          <Vega
            spec={spec}
            data={{ con: shape.value.continuous, dis: shape.value.discrete }}
            width={widthProp}
            height={height}
            actions={false}
          />
        </div>
      );
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
          {disableLog ? (
            <CheckBox
              label="Log X scale"
              value={isLogX}
              onChange={setLogX}
              disabled={true}
              tooltip={
                "Your distribution has mass lower than or equal to 0. Log only works on strictly positive values."
              }
            />
          ) : (
            <CheckBox label="Log X scale" value={isLogX} onChange={setLogX} />
          )}
          <CheckBox label="Exp Y scale" value={isExpY} onChange={setExpY} />
        </div>
      </>
    );
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
