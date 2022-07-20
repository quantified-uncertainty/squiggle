import React from "react";
import { squiggleExpression, declaration } from "@quri/squiggle-lang";
import { NumberShower } from "../NumberShower";
import { DistributionChart } from "../DistributionChart";
import { FunctionChart, FunctionChartSettings } from "../FunctionChart";
import clsx from "clsx";
import { VariableBox } from "./VariableBox";
import { ItemSettingsMenu } from "./ItemSettingsMenu";

function getRange<a>(x: declaration<a>) {
  const first = x.args[0];
  switch (first.tag) {
    case "Float": {
      return { floats: { min: first.value.min, max: first.value.max } };
    }
    case "Date": {
      return { time: { min: first.value.min, max: first.value.max } };
    }
  }
}

function getChartSettings<a>(x: declaration<a>): FunctionChartSettings {
  const range = getRange(x);
  const min = range.floats ? range.floats.min : 0;
  const max = range.floats ? range.floats.max : 10;
  return {
    start: min,
    stop: max,
    count: 20,
  };
}

const VariableList: React.FC<{
  path: string[];
  heading: string;
  children: React.ReactNode;
}> = ({ path, heading, children }) => (
  <VariableBox path={path} heading={heading}>
    {() => (
      <div className={clsx("space-y-3", path.length ? "pt-1 mt-1" : null)}>
        {children}
      </div>
    )}
  </VariableBox>
);

export interface Props {
  /** The output of squiggle's run */
  expression: squiggleExpression;
  /** Path to the current item, e.g. `['foo', 'bar', '3']` for `foo.bar[3]`; can be empty on the top-level item. */
  path: string[];
  width?: number;
  height: number;
}

export const ExpressionViewer: React.FC<Props> = ({
  path,
  expression,
  width,
  height,
}) => {
  switch (expression.tag) {
    case "number":
      return (
        <VariableBox path={path} heading="Number">
          {() => (
            <div className="font-semibold text-slate-600">
              <NumberShower precision={3} number={expression.value} />
            </div>
          )}
        </VariableBox>
      );
    case "distribution": {
      const distType = expression.value.type();
      return (
        <VariableBox
          path={path}
          heading={`Distribution (${distType})\n${
            distType === "Symbolic" ? expression.value.toString() : ""
          }`}
          dropdownMenu={({ settings, setSettings }) => {
            return (
              <ItemSettingsMenu settings={settings} setSettings={setSettings} />
            );
          }}
        >
          {(settings) => {
            return (
              <DistributionChart
                distribution={expression.value}
                {...settings.distributionPlotSettings}
                height={height}
                width={width}
              />
            );
          }}
        </VariableBox>
      );
    }
    case "string":
      return (
        <VariableBox path={path} heading="String">
          {() => (
            <>
              <span className="text-slate-400">"</span>
              <span className="text-slate-600 font-semibold font-mono">
                {expression.value}
              </span>
              <span className="text-slate-400">"</span>
            </>
          )}
        </VariableBox>
      );
    case "boolean":
      return (
        <VariableBox path={path} heading="Boolean">
          {() => expression.value.toString()}
        </VariableBox>
      );
    case "symbol":
      return (
        <VariableBox path={path} heading="Symbol">
          {() => (
            <>
              <span className="text-slate-500 mr-2">Undefined Symbol:</span>
              <span className="text-slate-600">{expression.value}</span>
            </>
          )}
        </VariableBox>
      );
    case "call":
      return (
        <VariableBox path={path} heading="Call">
          {() => expression.value}
        </VariableBox>
      );
    case "arraystring":
      return (
        <VariableBox path={path} heading="Array String">
          {() => expression.value.map((r) => `"${r}"`).join(", ")}
        </VariableBox>
      );
    case "date":
      return (
        <VariableBox path={path} heading="Date">
          {() => expression.value.toDateString()}
        </VariableBox>
      );
    case "timeDuration": {
      return (
        <VariableBox path={path} heading="Time Duration">
          {() => <NumberShower precision={3} number={expression.value} />}
        </VariableBox>
      );
    }
    case "lambda":
      return (
        <VariableBox
          path={path}
          heading="Function"
          dropdownMenu={({ settings, setSettings }) => {
            return (
              <ItemSettingsMenu settings={settings} setSettings={setSettings} />
            );
          }}
        >
          {(settings) => (
            <>
              <div className="text-amber-700 bg-amber-100 rounded-md font-mono p-1 pl-2 mb-3 mt-1 text-sm">{`function(${expression.value.parameters.join(
                ","
              )})`}</div>
              <FunctionChart
                fn={expression.value}
                chartSettings={settings.chartSettings}
                distributionPlotSettings={settings.distributionPlotSettings}
                height={height}
                environment={{
                  sampleCount: settings.environment.sampleCount / 10,
                  xyPointLength: settings.environment.xyPointLength / 10,
                }}
              />
            </>
          )}
        </VariableBox>
      );
    case "lambdaDeclaration": {
      return (
        <VariableBox
          path={path}
          heading="Function Declaration"
          dropdownMenu={({ settings, setSettings }) => {
            return (
              <ItemSettingsMenu settings={settings} setSettings={setSettings} />
            );
          }}
        >
          {(settings) => (
            <FunctionChart
              fn={expression.value.fn}
              chartSettings={getChartSettings(expression.value)}
              distributionPlotSettings={settings.distributionPlotSettings}
              height={height}
              environment={{
                sampleCount: settings.environment.sampleCount / 10,
                xyPointLength: settings.environment.xyPointLength / 10,
              }}
            />
          )}
        </VariableBox>
      );
    }
    case "module": {
      return (
        <VariableList path={path} heading="Module">
          {Object.entries(expression.value)
            .filter(([key, r]) => key !== "Math")
            .map(([key, r]) => (
              <ExpressionViewer
                key={key}
                path={[...path, key]}
                expression={r}
                width={width !== undefined ? width - 20 : width}
                height={height / 3}
              />
            ))}
        </VariableList>
      );
    }
    case "record":
      return (
        <VariableList path={path} heading="Record">
          {Object.entries(expression.value).map(([key, r]) => (
            <ExpressionViewer
              key={key}
              path={[...path, key]}
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={height / 3}
            />
          ))}
        </VariableList>
      );
    case "array":
      return (
        <VariableList path={path} heading="Array">
          {expression.value.map((r, i) => (
            <ExpressionViewer
              key={i}
              path={[...path, String(i)]}
              expression={r}
              width={width !== undefined ? width - 20 : width}
              height={50}
            />
          ))}
        </VariableList>
      );
    default: {
      return (
        <div>
          <span>No display for type: </span>{" "}
          <span className="font-semibold text-slate-600">{expression.tag}</span>
        </div>
      );
    }
  }
};
