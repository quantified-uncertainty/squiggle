import {
  SqDistributionTag,
  SqDistributionsPlot,
  SqPlot,
  SqScale,
  SqValue,
} from "@quri/squiggle-lang";
import { clsx } from "clsx";
import React from "react";

import { DistributionsChart } from "../DistributionsChart/index.js";
import { FunctionChart } from "../FunctionChart/index.js";
import { NumberShower } from "../NumberShower.js";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { DistFunctionChart } from "../FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../FunctionChart/NumericFunctionChart.js";
import { ScatterChart } from "../ScatterChart/index.js";
import { generateDistributionPlotSettings } from "../ViewSettingsForm.js";
import { ItemSettingsMenu } from "./ItemSettingsMenu.js";
import { VariableBox } from "./VariableBox.js";
import { MergedItemSettings } from "./utils.js";

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
          value.location!.path.items.length ? "pt-1 mt-1" : null
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

export const ExpressionViewer: React.FC<Props> = ({ value }) => {
  const environment = value.location!.project.getEnvironment();

  switch (value.tag) {
    case "Number":
      return (
        <VariableBox value={value} heading="Number">
          {() => (
            <div className="font-semibold text-slate-600">
              <NumberShower precision={3} number={value.value} />
            </div>
          )}
        </VariableBox>
      );
    case "Dist": {
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
            const shape = value.location
              ? value.value.pointSet(value.location.project.getEnvironment())
              : undefined;

            return (
              <ItemSettingsMenu
                value={value}
                onChange={onChange}
                fixed={
                  shape?.ok && hasMassBelowZero(shape.value.asShape())
                    ? {
                        distributionChartSettings: {
                          disableLogX: true,
                        },
                      }
                    : undefined
                }
                withFunctionSettings={false}
              />
            );
          }}
        >
          {(settings) => {
            const plot = SqDistributionsPlot.create({
              distribution: value.value,
              ...generateDistributionPlotSettings(
                settings.distributionChartSettings
              ),
            });

            return (
              <DistributionsChart
                plot={plot}
                environment={environment}
                height={settings.chartHeight}
              />
            );
          }}
        </VariableBox>
      );
    }
    case "String":
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
    case "Bool":
      return (
        <VariableBox value={value} heading="Boolean">
          {() => value.value.toString()}
        </VariableBox>
      );
    case "Date":
      return (
        <VariableBox value={value} heading="Date">
          {() => value.value.toDateString()}
        </VariableBox>
      );
    case "Void":
      return (
        <VariableBox value={value} heading="Void">
          {() => "Void"}
        </VariableBox>
      );
    case "TimeDuration": {
      return (
        <VariableBox value={value} heading="Time Duration">
          {() => <NumberShower precision={3} number={value.value} />}
        </VariableBox>
      );
    }
    case "Lambda":
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
          {(settings) => {
            return (
              <FunctionChart
                fn={value.value}
                settings={settings}
                height={settings.chartHeight}
                environment={{
                  sampleCount: environment.sampleCount / 10,
                  xyPointLength: environment.xyPointLength / 10,
                }}
              />
            );
          }}
        </VariableBox>
      );
    case "Plot": {
      const plot: SqPlot = value.value;

      return (
        <VariableBox value={value} heading="Plot">
          {(settings) => {
            switch (plot.tag) {
              case "distributions":
                return (
                  <DistributionsChart
                    plot={plot}
                    environment={environment}
                    height={settings.chartHeight}
                  />
                );
              case "numericFn": {
                return (
                  <NumericFunctionChart
                    plot={plot}
                    height={settings.chartHeight}
                  />
                );
              }
              case "distFn": {
                return (
                  <DistFunctionChart
                    plot={plot}
                    height={settings.chartHeight}
                    environment={{
                      sampleCount: environment.sampleCount / 10,
                      xyPointLength: environment.xyPointLength / 10,
                    }}
                  />
                );
              }
              case "scatter":
                return (
                  <ScatterChart
                    plot={plot}
                    height={settings.chartHeight}
                    environment={environment}
                  />
                );
              default:
                // can happen if squiggle-lang version is too fresh and we messed up the components -> squiggle-lang dependency
                return `Unsupported plot type ${(plot as any).tag}`;
            }
          }}
        </VariableBox>
      );
    }
    case "Scale": {
      const scale: SqScale = value.value;

      return (
        <VariableBox value={value} heading="Scale">
          {(settings) => <div>{scale.toString()}</div>}
        </VariableBox>
      );
    }
    case "Record":
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
    case "Array":
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
