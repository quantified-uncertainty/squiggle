import React from "react";
import { SqDistributionTag, SqValue, SqPlot } from "@quri/squiggle-lang";
import { clsx } from "clsx";

import { NumberShower } from "../NumberShower.js";
import { DistributionChart } from "../DistributionChart.js";
import {
  sqPlotToPlot,
  MultiDistributionChart,
} from "../MultiDistributionChart/index.js";
import { FunctionChart } from "../FunctionChart/index.js";

import { VariableBox } from "./VariableBox.js";
import { ItemSettingsMenu } from "./ItemSettingsMenu.js";
import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { MergedItemSettings } from "./utils.js";
import { PartialViewSettings } from "../ViewSettingsForm.js";

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

export const ExpressionViewer: React.FC<Props> = ({ value }) => {
  const environment = value.location.project.getEnvironment();

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
            const shape = value.value.pointSet(
              value.location.project.getEnvironment()
            );
            return (
              <ItemSettingsMenu
                value={value}
                onChange={onChange}
                fixed={
                  shape.ok && hasMassBelowZero(shape.value.asShape())
                    ? {
                        distributionChartSettings: {
                          logX: false,
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
            return (
              <DistributionChart
                distribution={value.value}
                environment={environment}
                height={settings.chartHeight}
                settings={settings.distributionChartSettings}
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
    case "Declaration": {
      const fixed: PartialViewSettings = {};
      const { inputs } = value.value;
      if (inputs.length === 1 && inputs[0].type === "Float") {
        fixed.functionChartSettings = {
          start: inputs[0].min,
          stop: inputs[0].max,
        };
      }

      return (
        <VariableBox
          value={value}
          heading="Function Declaration"
          renderSettingsMenu={({ onChange }) => {
            return (
              <ItemSettingsMenu
                onChange={onChange}
                value={value}
                fixed={fixed}
                withFunctionSettings={true}
              />
            );
          }}
        >
          {(settings) => (
            <FunctionChart
              fn={value.value.fn}
              settings={{
                ...settings.functionChartSettings,
                ...fixed.functionChartSettings,
              }}
              distributionChartSettings={settings.distributionChartSettings}
              height={settings.chartHeight}
              environment={{
                sampleCount: environment.sampleCount / 10,
                xyPointLength: environment.xyPointLength / 10,
              }}
            />
          )}
        </VariableBox>
      );
    }
    case "Plot":
      const plot: SqPlot = value.value;
      const fixed: PartialViewSettings = {};
      const disableLogX =
        plot.tag === "distributions"
          ? plot.distributions.some((x) => {
              let pointSet = x.distribution.pointSet(environment);
              return pointSet.ok && hasMassBelowZero(pointSet.value.asShape());
            })
          : false;
      if (disableLogX) {
        fixed.distributionChartSettings = {
          logX: false,
        };
      }
      fixed.functionChartSettings = {};
      if (plot.tag === "fn") {
        fixed.functionChartSettings.start = plot.min;
        fixed.functionChartSettings.stop = plot.max;
      }

      return (
        <VariableBox
          value={value}
          heading="Plot"
          renderSettingsMenu={({ onChange }) => {
            return (
              <ItemSettingsMenu
                value={value}
                onChange={onChange}
                fixed={fixed}
                withFunctionSettings={plot.tag === "fn"}
              />
            );
          }}
        >
          {(settings) => {
            switch (plot.tag) {
              case "distributions":
                return (
                  <MultiDistributionChart
                    plot={sqPlotToPlot(plot)}
                    environment={environment}
                    height={settings.chartHeight}
                    settings={settings.distributionChartSettings}
                  />
                );
              case "fn":
                return (
                  <FunctionChart
                    fn={plot.fn}
                    settings={{
                      ...settings.functionChartSettings,
                      ...fixed.functionChartSettings,
                    }}
                    distributionChartSettings={
                      settings.distributionChartSettings
                    }
                    height={settings.chartHeight}
                    environment={{
                      sampleCount: environment.sampleCount / 10,
                      xyPointLength: environment.xyPointLength / 10,
                    }}
                  />
                );
            }
          }}
        </VariableBox>
      );
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
