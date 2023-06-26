import {
  SqDistributionTag,
  SqDistributionsPlot,
  SqPlot,
  SqScale,
  SqValue,
} from "@quri/squiggle-lang";
import { clsx } from "clsx";
import React, { Children } from "react";

import { DistributionsChart } from "../DistributionsChart/index.js";
import { FunctionChart } from "../FunctionChart/index.js";
import { NumberShower } from "../NumberShower.js";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { DistFunctionChart } from "../FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../FunctionChart/NumericFunctionChart.js";
import { ScatterChart } from "../ScatterChart/index.js";
import { generateDistributionPlotSettings } from "../PlaygroundSettings.js";
import { ItemSettingsMenu } from "./ItemSettingsMenu.js";
import {
  SqTypeWithCount,
  VariableBox,
  VariableBoxProps,
} from "./VariableBox.js";
import { MergedItemSettings, getChildrenValues } from "./utils.js";
import { RelativeValuesGridChart } from "../RelativeValuesGridChart/index.js";

const VariableList: React.FC<{
  value: SqValue;
  heading: string;
  preview?: React.ReactNode;
  children: (settings: MergedItemSettings) => React.ReactNode;
}> = ({ value, heading, children, preview }) => (
  <VariableBox value={value} preview={preview} heading={heading}>
    {(settings) => (
      <div
        className={clsx(
          "space-y-2",
          value.path!.items.length ? "pt-1 mt-1" : null
        )}
      >
        {children(settings)}
      </div>
    )}
  </VariableBox>
);

//Note: This doesn't really need to return "value", but it was nice to use VariableBoxProps
export const getBoxProps = (value: SqValue): VariableBoxProps => {
  const environment = value.path!.project.getEnvironment();

  switch (value.tag) {
    case "Number":
      return {
        value: value,
        heading: "Number",
        preview: <NumberShower precision={3} number={value.value} />,
        children: () => (
          <div className="font-semibold text-neutral-600">
            <NumberShower precision={3} number={value.value} />
          </div>
        ),
      };
    case "Dist": {
      const distType = value.value.tag;

      return {
        value: value,
        heading: `${distType} Distribution`,
        renderSettingsMenu: ({ onChange }) => {
          const shape = value.path
            ? value.value.pointSet(value.path.project.getEnvironment())
            : undefined;

          return (
            <ItemSettingsMenu
              value={value}
              onChange={onChange}
              metaSettings={{
                disableLogX:
                  shape?.ok && hasMassBelowZero(shape.value.asShape()),
              }}
              withFunctionSettings={false}
            />
          );
        },
        children: (settings) => {
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
        },
      };
    }
    case "String":
      return {
        value: value,
        heading: "String",
        preview:
          value.value.substring(0, 30) + (value.value.length > 30 ? "..." : ""),
        children: () => (
          <>
            <span className="text-neutral-300">"</span>
            <span className="text-neutral-600 text-sm">{value.value}</span>
            <span className="text-neutral-300">"</span>
          </>
        ),
      };
    case "Bool":
      return {
        value: value,
        heading: "Boolean",

        preview: value.value.toString(),
        children: () => (
          <span className="text-neutral-600 text-sm font-mono">
            {value.value.toString()}
          </span>
        ),
      };
    case "Date":
      return {
        value: value,
        heading: "Date",

        children: () => value.value.toDateString(),
      };

    case "Void":
      return {
        value: value,
        heading: "Void",
        children: () => "Void",
      };
    case "TimeDuration": {
      return {
        value: value,
        heading: "Time Duration",

        children: () => <NumberShower precision={3} number={value.value} />,
      };
    }
    case "Lambda":
      return {
        value: value,
        heading: ``,
        preview: `fn(${value.value.parameters().join(", ")})`,
        renderSettingsMenu: ({ onChange }) => {
          return (
            <ItemSettingsMenu
              value={value}
              onChange={onChange}
              withFunctionSettings={true}
            />
          );
        },
        children: (settings) => {
          if (value.value.parameters().length === 0) {
            const fnResult = value.value.call([], environment);
            if (fnResult.ok && value.path) {
              const fnValue: SqValue = fnResult.value.withPath(value.path);
              return getBoxProps(fnValue).children(settings);
            }
          } else {
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
          }
        },
      };
    case "Plot": {
      const plot: SqPlot = value.value;
      return {
        value: value,
        heading: "Plot",
        children: (settings) => {
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
                  environment={environment}
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
            case "relativeValues":
              return (
                <RelativeValuesGridChart
                  plot={plot}
                  environment={environment}
                />
              );
            default:
              // can happen if squiggle-lang version is too fresh and we messed up the components -> squiggle-lang dependency
              return `Unsupported plot type ${(plot as any).tag}`;
          }
        },
      };
    }
    case "Scale": {
      const scale: SqScale = value.value;
      return {
        value: value,
        heading: "Scale",
        children: () => <div>{scale.toString()}</div>,
      };
    }
    case "Record": {
      const entries = getChildrenValues(value);
      return {
        value: value,
        heading: `Record(${entries.length})`,
        preview: <SqTypeWithCount type="{}" count={entries.length} />,
        children: () =>
          entries.map((r, i) => <ExpressionViewer key={i} value={r} />),
      };
    }
    case "Array": {
      const entries = getChildrenValues(value);
      const length = entries.length;
      return {
        value: value,
        heading: `List(${length})`,
        preview: <SqTypeWithCount type="[]" count={length} />,
        children: () =>
          entries.map((r, i) => <ExpressionViewer key={i} value={r} />),
      };
    }

    default: {
      return {
        value: value,
        heading: "Error",
        children: () => (
          <div>
            <span>No display for type: </span>{" "}
            <span className="font-semibold text-neutral-600">
              {(value as { tag: string }).tag}
            </span>
          </div>
        ),
      };
    }
  }
};

export interface Props {
  /** The output of squiggle's run */
  value: SqValue;
  width?: number;
}

export const ExpressionViewer: React.FC<Props> = ({ value }) => {
  const boxProps = getBoxProps(value);
  switch (value.tag) {
    case "Record":
    case "Array":
      return (
        <VariableList
          value={value}
          heading={boxProps.heading}
          preview={boxProps.preview}
        >
          {boxProps.children}
        </VariableList>
      );
    default:
      return (
        <VariableBox
          value={value}
          heading={boxProps.heading}
          preview={boxProps.preview}
        >
          {boxProps.children}
        </VariableBox>
      );
  }
};
