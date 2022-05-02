import * as React from "react";
import _ from "lodash";
import styled from "styled-components";
import {
  run,
  errorValueToString,
  squiggleExpression,
  bindings,
  samplingParams,
  jsImports,
  defaultImports,
  defaultBindings,
} from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import { DistributionChart } from "./DistributionChart";
import { ErrorBox } from "./ErrorBox";

const variableBox = {
  Component: styled.div`
    background: white;
    border: 1px solid #eee;
    border-radius: 2px;
    margin-bottom: 0.4em;
  `,
  Heading: styled.div`
    border-bottom: 1px solid #eee;
    padding-left: 0.8em;
    padding-right: 0.8em;
    padding-top: 0.1em;
  `,
  Body: styled.div`
    padding: 0.4em 0.8em;
  `,
};

interface VariableBoxProps {
  heading: string;
  children: React.ReactNode;
  showTypes?: boolean;
}

export const VariableBox: React.FC<VariableBoxProps> = ({
  heading = "Error",
  children,
  showTypes = false,
}: VariableBoxProps) => {
  if (showTypes) {
    return (
      <variableBox.Component>
        <variableBox.Heading>
          <h3>{heading}</h3>
        </variableBox.Heading>
        <variableBox.Body>{children}</variableBox.Body>
      </variableBox.Component>
    );
  } else {
    return <>{children}</>;
  }
};

let RecordKeyHeader = styled.h3``;

export interface SquiggleItemProps {
  /** The input string for squiggle */
  expression: squiggleExpression;
  width?: number;
  height: number;
  /** Whether to show type information */
  showTypes?: boolean;
  /** Whether to show users graph controls (scale etc) */
  showControls?: boolean;
}

const SquiggleItem: React.FC<SquiggleItemProps> = ({
  expression,
  width,
  height,
  showTypes = false,
  showControls = false,
}: SquiggleItemProps) => {
  switch (expression.tag) {
    case "number":
      return (
        <VariableBox heading="Number" showTypes={showTypes}>
          <NumberShower precision={3} number={expression.value} />
        </VariableBox>
      );
    case "distribution": {
      let distType = expression.value.type();
      return (
        <VariableBox
          heading={`Distribution (${distType})`}
          showTypes={showTypes}
        >
          {distType === "Symbolic" && showTypes ? (
            <>
              <div>{expression.value.toString()}</div>
            </>
          ) : (
            <></>
          )}
          <DistributionChart
            distribution={expression.value}
            height={height}
            width={width}
            showControls={showControls}
          />
        </VariableBox>
      );
    }
    case "string":
      return (
        <VariableBox
          heading="String"
          showTypes={showTypes}
        >{`"${expression.value}"`}</VariableBox>
      );
    case "boolean":
      return (
        <VariableBox heading="Boolean" showTypes={showTypes}>
          {expression.value.toString()}
        </VariableBox>
      );
    case "symbol":
      return (
        <VariableBox heading="Symbol" showTypes={showTypes}>
          {expression.value}
        </VariableBox>
      );
    case "call":
      return (
        <VariableBox heading="Call" showTypes={showTypes}>
          {expression.value}
        </VariableBox>
      );
    case "array":
      return (
        <VariableBox heading="Array" showTypes={showTypes}>
          {expression.value.map((r) => (
            <SquiggleItem
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={50}
              showTypes={showTypes}
              showControls={showControls}
            />
          ))}
        </VariableBox>
      );
    case "record":
      return (
        <VariableBox heading="Record" showTypes={showTypes}>
          {Object.entries(expression.value).map(([key, r]) => (
            <>
              <RecordKeyHeader>{key}</RecordKeyHeader>
              <SquiggleItem
                expression={r}
                width={width !== undefined ? width - 20 : width}
                height={50}
                showTypes={showTypes}
                showControls={showControls}
              />
            </>
          ))}
        </VariableBox>
      );
  }
};

export interface SquiggleChartProps {
  /** The input string for squiggle */
  squiggleString?: string;
  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount?: number;
  /** The amount of points returned to draw the distribution */
  outputXYPoints?: number;
  kernelWidth?: number;
  pointDistLength?: number;
  /** If the result is a function, where the function starts */
  diagramStart?: number;
  /** If the result is a function, where the function ends */
  diagramStop?: number;
  /** If the result is a function, how many points along the function it samples */
  diagramCount?: number;
  /** When the environment changes */
  onChange?(expr: squiggleExpression): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
  /** Bindings of previous variables declared */
  bindings?: bindings;
  /** JS imported parameters */
  jsImports?: jsImports;
  /** Whether to show type information about returns, default false */
  showTypes?: boolean;
  /** Whether to show graph controls (scale etc)*/
  showControls?: boolean;
}

const ChartWrapper = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
`;

export const SquiggleChart: React.FC<SquiggleChartProps> = ({
  squiggleString = "",
  sampleCount = 1000,
  outputXYPoints = 1000,
  onChange = () => {},
  height = 60,
  bindings = defaultBindings,
  jsImports = defaultImports,
  width,
  showTypes = false,
  showControls = false,
}: SquiggleChartProps) => {
  let samplingInputs: samplingParams = {
    sampleCount: sampleCount,
    xyPointLength: outputXYPoints,
  };
  let expressionResult = run(
    squiggleString,
    bindings,
    samplingInputs,
    jsImports
  );
  let internal: JSX.Element;
  if (expressionResult.tag === "Ok") {
    let expression = expressionResult.value;
    onChange(expression);
    internal = (
      <SquiggleItem
        expression={expression}
        width={width}
        height={height}
        showTypes={showTypes}
        showControls={showControls}
      />
    );
  } else {
    internal = (
      <ErrorBox heading={"Parse Error"}>
        {errorValueToString(expressionResult.value)}
      </ErrorBox>
    );
  }
  return <ChartWrapper>{internal}</ChartWrapper>;
};
