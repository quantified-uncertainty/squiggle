import * as React from "react";
import _ from "lodash";
import styled from "styled-components";
import {
  run,
  errorValueToString,
  squiggleExpression,
  bindings,
  environment,
  jsImports,
  defaultImports,
  defaultBindings,
  defaultEnvironment,
  declarationArg,
  declaration
} from "@quri/squiggle-lang";
import { NumberShower } from "./NumberShower";
import { DistributionChart } from "./DistributionChart";
import { ErrorBox } from "./ErrorBox";
import { FunctionChart, FunctionChartSettings } from "./FunctionChart";

function getRange<a>(x: declaration<a>) {
  let first = x.args[0];
  switch (first.tag) {
    case "Float": {
      return { floats: { min: first.value.min, max: first.value.max } };
    }
    case "Time": {
      return { time: { min: first.value.min, max: first.value.max } };
    }
  }
}
function getChartSettings<a>(
  x: declaration<a>
): FunctionChartSettings {
  let range = getRange(x);
  let min = range.floats ? range.floats.min : 0;
  let max = range.floats ? range.floats.max : 10;
  return {
    start: min,
    stop: max,
    count: 20,
  };
}

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
  showTypes: boolean;
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
    return <div>{children}</div>;
  }
};

let RecordKeyHeader = styled.h3``;

export interface SquiggleItemProps {
  /** The input string for squiggle */
  expression: squiggleExpression;
  width?: number;
  height: number;
  /** Whether to show a summary of statistics for distributions */
  showSummary: boolean;
  /** Whether to show type information */
  showTypes: boolean;
  /** Whether to show users graph controls (scale etc) */
  showControls: boolean;
  /** Settings for displaying functions */
  chartSettings: FunctionChartSettings;
  /** Environment for further function executions */
  environment: environment;
}

const SquiggleItem: React.FC<SquiggleItemProps> = ({
  expression,
  width,
  height,
  showSummary,
  showTypes = false,
  showControls = false,
  chartSettings,
  environment,
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
            showSummary={showSummary}
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
          {expression.value.map((r, i) => (
            <SquiggleItem
              key={i}
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={50}
              showTypes={showTypes}
              showControls={showControls}
              chartSettings={chartSettings}
              environment={environment}
              showSummary={showSummary}
            />
          ))}
        </VariableBox>
      );
    case "record":
      return (
        <VariableBox heading="Record" showTypes={showTypes}>
          {Object.entries(expression.value).map(([key, r]) => (
            <div key={key}>
              <RecordKeyHeader>{key}</RecordKeyHeader>
              <SquiggleItem
                expression={r}
                width={width !== undefined ? width - 20 : width}
                height={50}
                showTypes={showTypes}
                showSummary={showSummary}
                showControls={showControls}
                chartSettings={chartSettings}
                environment={environment}
              />
            </div>
          ))}
          )
        </VariableBox>
      );
    case "arraystring":
      return (
        <VariableBox heading="Array String" showTypes={showTypes}>
          {expression.value.map((r) => `"${r}"`).join(", ")}
        </VariableBox>
      );
    case "date":
      return (
        <VariableBox heading="Date" showTypes={showTypes}>
          {expression.value.toDateString()}
        </VariableBox>
      );
    case "timeDuration": {
      return (
        <VariableBox heading="Time Duration" showTypes={showTypes}>
          <NumberShower precision={3} number={expression.value} />
        </VariableBox>
      );
    }
    case "lambda":
      return (
        <FunctionChart
          fn={expression.value}
          chartSettings={chartSettings}
          environment={{
            sampleCount: environment.sampleCount / 10,
            xyPointLength: environment.xyPointLength / 10,
          }}
        />
      );
    case "lambdaDeclaration": {
          return (
            <FunctionChart
              fn={expression.value.fn}
              chartSettings={getChartSettings(expression.value)}
              environment={{
                sampleCount: environment.sampleCount / 10,
                xyPointLength: environment.xyPointLength / 10,
              }}
            />
          );
      }
    default: {
      return <>Should be unreachable</>;
    }
  }
};

export interface SquiggleChartProps {
  /** The input string for squiggle */
  squiggleString?: string;
  /** If the output requires monte carlo sampling, the amount of samples */
  sampleCount?: number;
  /** The amount of points returned to draw the distribution */
  environment?: environment;
  /** If the result is a function, where the function starts, ends and the amount of stops */
  chartSettings?: FunctionChartSettings;
  /** When the environment changes */
  onChange?(expr: squiggleExpression): void;
  /** CSS width of the element */
  width?: number;
  height?: number;
  /** Bindings of previous variables declared */
  bindings?: bindings;
  /** JS imported parameters */
  jsImports?: jsImports;
  /** Whether to show a summary of the distirbution */
  showSummary?: boolean;
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

let defaultChartSettings = { start: 0, stop: 10, count: 20 };

export const SquiggleChart: React.FC<SquiggleChartProps> = ({
  squiggleString = "",
  environment,
  onChange = () => {},
  height = 60,
  bindings = defaultBindings,
  jsImports = defaultImports,
  showSummary = false,
  width,
  showTypes = false,
  showControls = false,
  chartSettings = defaultChartSettings,
}: SquiggleChartProps) => {
  let expressionResult = run(squiggleString, bindings, environment, jsImports);
  let e = environment ? environment : defaultEnvironment;
  let internal: JSX.Element;
  if (expressionResult.tag === "Ok") {
    let expression = expressionResult.value;
    onChange(expression);
    internal = (
      <SquiggleItem
        expression={expression}
        width={width}
        height={height}
        showSummary={showSummary}
        showTypes={showTypes}
        showControls={showControls}
        chartSettings={chartSettings}
        environment={e}
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
