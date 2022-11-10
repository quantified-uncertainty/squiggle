import React from "react";
import { SqDistributionTag, SqValue, SqValueTag } from "@quri/squiggle-lang";
import { NumberShower } from "../NumberShower";
import { DistributionChart, defaultPlot, makePlot } from "../DistributionChart";
import { FunctionChart } from "../FunctionChart";
import clsx from "clsx";
import { VariableBox } from "./VariableBox";
import { ItemSettingsMenu } from "./ItemSettingsMenu";
import { hasMassBelowZero } from "../../lib/distributionUtils";
import { MergedItemSettings } from "./utils";

/*
// DISABLED FOR NOW
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
*/

const VariableList: React.FC<{
  value: SqValue;
  heading: string;
  children: (settings: MergedItemSettings) => React.ReactNode;
}> = ({ value, heading, children }) => (
  <VariableBox value={value} heading={heading}>
    {(settings) => (
      <div
        className={clsx(
          "space-y-3",
          value.location.path.items.length ? "pt-1 mt-1" : null
        )}
      >
        {children(settings)}
      </div>
    )}
  </VariableBox>
);

export interface Props {
  /** The output of squiggle's run */
  value: SqValue;
  width?: number;
}

export const ExpressionViewer: React.FC<Props> = ({ value, width }) => {
  const environment = value.location.project.getEnvironment();

  switch (value.tag) {
    case SqValueTag.Number:
      return (
        <VariableBox value={value} heading="Number">
          {() => (
            <div className="font-semibold text-slate-600">
              <NumberShower precision={3} number={value.value} />
            </div>
          )}
        </VariableBox>
      );
    case SqValueTag.Distribution: {
      const distType = value.value.tag;
      return (
        <VariableBox
          value={value}
          heading={`Distribution (${distType})\n${
            distType === SqDistributionTag.Symbolic
              ? value.value.toString()
              : ""
          }`}
          renderSettingsMenu={({ onChange }) => {
            const shape = value.value.pointSet(
              value.location.project.getEnvironment()
            );
            return (
              <ItemSettingsMenu
                value={value}
                onChange={onChange}
                disableLogX={
                  shape.tag === "Ok" && hasMassBelowZero(shape.value.asShape())
                }
                withFunctionSettings={false}
              />
            );
          }}
        >
          {(settings) => {
            return (
              <DistributionChart
                plot={defaultPlot(value.value)}
                environment={environment}
                chartHeight={settings.chartHeight}
                settings={settings.distributionChartSettings}
              />
            );
          }}
        </VariableBox>
      );
    }
    case SqValueTag.String:
      return (
        <VariableBox value={value} heading="String">
          {() => (
            <>
              <span className="text-slate-400">"</span>
              <span className="text-slate-600 font-semibold font-mono">
                {value.value}
              </span>
              <span className="text-slate-400">"</span>
            </>
          )}
        </VariableBox>
      );
    case SqValueTag.Bool:
      return (
        <VariableBox value={value} heading="Boolean">
          {() => value.value.toString()}
        </VariableBox>
      );
    case SqValueTag.Date:
      return (
        <VariableBox value={value} heading="Date">
          {() => value.value.toDateString()}
        </VariableBox>
      );
    case SqValueTag.Void:
      return (
        <VariableBox value={value} heading="Void">
          {() => "Void"}
        </VariableBox>
      );
    case SqValueTag.TimeDuration: {
      return (
        <VariableBox value={value} heading="Time Duration">
          {() => <NumberShower precision={3} number={value.value} />}
        </VariableBox>
      );
    }
    case SqValueTag.Lambda:
      return (
        <VariableBox
          value={value}
          heading="Function"
          renderSettingsMenu={({ onChange }) => {
            return (
              <ItemSettingsMenu
                value={value}
                onChange={onChange}
                withFunctionSettings={true}
              />
            );
          }}
        >
          {(settings) => (
            <>
              <div className="text-amber-700 bg-amber-100 rounded-md font-mono p-1 pl-2 mb-3 mt-1 text-sm">{`function(${value.value
                .parameters()
                .join(",")})`}</div>
              <FunctionChart
                fn={value.value}
                settings={settings.functionChartSettings}
                distributionChartSettings={settings.distributionChartSettings}
                height={settings.chartHeight}
                environment={{
                  sampleCount: environment.sampleCount / 10,
                  xyPointLength: environment.xyPointLength / 10,
                }}
              />
            </>
          )}
        </VariableBox>
      );
    case SqValueTag.Declaration: {
      return (
        <VariableBox
          value={value}
          heading="Function Declaration"
          renderSettingsMenu={({ onChange }) => {
            return (
              <ItemSettingsMenu
                onChange={onChange}
                value={value}
                withFunctionSettings={true}
              />
            );
          }}
        >
          {(_) => (
            <div>NOT IMPLEMENTED YET</div>
            // <FunctionChart
            //   fn={expression.value.fn}
            //   chartSettings={getChartSettings(expression.value)}
            //   distributionChartSettings={settings.distributionChartSettings}
            //   height={settings.height}
            //   environment={{
            //     sampleCount: environment.sampleCount / 10,
            //     xyPointLength: environment.xyPointLength / 10,
            //   }}
            // />
          )}
        </VariableBox>
      );
    }
    case SqValueTag.Record:
      const plot = makePlot(value.value);
      if (plot) {
        return (
          <VariableBox
            value={value}
            heading="Plot"
            renderSettingsMenu={({ onChange }) => {
              let disableLogX = plot.distributions.some((x) => {
                let pointSet = x.distribution.pointSet(environment);
                return (
                  pointSet.tag === "Ok" &&
                  hasMassBelowZero(pointSet.value.asShape())
                );
              });
              return (
                <ItemSettingsMenu
                  value={value}
                  onChange={onChange}
                  disableLogX={disableLogX}
                  withFunctionSettings={false}
                />
              );
            }}
          >
            {(settings) => {
              return (
                <DistributionChart
                  plot={plot}
                  environment={environment}
                  chartHeight={settings.chartHeight}
                  settings={settings.distributionChartSettings}
                />
              );
            }}
          </VariableBox>
        );
      } else {
        return (
          <VariableList value={value} heading="Record">
            {() => {
              const entries = value.value.entries();
              if (!entries.length) {
                return <div className="text-slate-400">Empty record</div>;
              }
              return entries.map(([key, r]) => (
                <ExpressionViewer key={key} value={r} />
              ));
            }}
          </VariableList>
        );
      }
    case SqValueTag.Array:
      return (
        <VariableList value={value} heading="Array">
          {(_) =>
            value.value
              .getValues()
              .map((r, i) => <ExpressionViewer key={i} value={r} />)
          }
        </VariableList>
      );
    default: {
      return (
        <VariableList value={value} heading="Error">
          {() => (
            <div>
              <span>No display for type: </span>{" "}
              <span className="font-semibold text-slate-600">
                {(value as { tag: string }).tag}
              </span>
            </div>
          )}
        </VariableList>
      );
    }
  }
};
