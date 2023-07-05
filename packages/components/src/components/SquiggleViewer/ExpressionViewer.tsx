import React, { ReactNode } from "react";

import {
  SqDistributionsPlot,
  SqPlot,
  SqScale,
  SqValue,
} from "@quri/squiggle-lang";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { SqValueWithPath, valueHasPath } from "../../lib/utility.js";
import { DistributionsChart } from "../DistributionsChart/index.js";
import { DistFunctionChart } from "../FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../FunctionChart/NumericFunctionChart.js";
import { FunctionChart } from "../FunctionChart/index.js";
import { NumberShower } from "../NumberShower.js";
import { generateDistributionPlotSettings } from "../PlaygroundSettings.js";
import { RelativeValuesGridChart } from "../RelativeValuesGridChart/index.js";
import { ScatterChart } from "../ScatterChart/index.js";
import { ItemSettingsMenu } from "./ItemSettingsMenu.js";
import {
  SqTypeWithCount,
  VariableBox,
  VariableBoxProps,
} from "./VariableBox.js";
import { MergedItemSettings, getChildrenValues } from "./utils.js";
import { MessageAlert } from "../Alert.js";

export const getBoxProps = (
  value: SqValueWithPath
): Omit<VariableBoxProps, "value"> => {
  const environment = value.path.project.getEnvironment();

  switch (value.tag) {
    case "Number":
      return {
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
        heading: `${distType} Distribution`,
        renderSettingsMenu: ({ onChange }) => {
          const shape = value.value.pointSet(
            value.path.project.getEnvironment()
          );

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
        preview: (
          <div className="overflow-ellipsis overflow-hidden">
            {value.value.substring(0, 20) +
              (value.value.length > 20 ? "..." : "")}
          </div>
        ),
        children: () => (
          <div className="text-neutral-800 text-sm px-2 py-1 my-1 bg-stone-100">
            {value.value}
          </div>
        ),
      };
    case "Bool":
      return {
        preview: value.value.toString(),
        children: () => (
          <span className="text-neutral-600 text-sm font-mono">
            {value.value.toString()}
          </span>
        ),
      };
    case "Date":
      return {
        children: () => value.value.toDateString(),
      };

    case "Void":
      return {
        children: () => "Void",
      };
    case "TimeDuration": {
      return {
        children: () => <NumberShower precision={3} number={value.value} />,
      };
    }
    case "Lambda":
      return {
        heading: "",
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
        children: (settings) => (
          <FunctionChart
            fn={value.value}
            settings={settings}
            height={settings.chartHeight}
            environment={{
              sampleCount: environment.sampleCount / 10,
              xyPointLength: environment.xyPointLength / 10,
            }}
          />
        ),
      };
    case "Plot": {
      const plot: SqPlot = value.value;
      return {
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
              return `Unsupported plot ${plot satisfies never}`;
          }
        },
      };
    }
    case "Scale": {
      const scale: SqScale = value.value;
      return {
        children: () => <div>{scale.toString()}</div>,
      };
    }
    case "Record": {
      const entries = getChildrenValues(value);
      return {
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
        heading: `List(${length})`,
        preview: <SqTypeWithCount type="[]" count={length} />,
        children: () =>
          entries.map((r, i) => <ExpressionViewer key={i} value={r} />),
      };
    }

    default: {
      return {
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

type Props = {
  /** The output of squiggle's run */
  value: SqValue;
  width?: number;
};

export const ExpressionViewer: React.FC<Props> = ({ value }) => {
  if (!valueHasPath(value)) {
    return <MessageAlert heading="Can't display pathless value" />;
  }

  const boxProps = getBoxProps(value);
  const heading = boxProps.heading || value.tag;
  const hasChildren = () => !!getChildrenValues(value);
  const children: (settings: MergedItemSettings) => ReactNode =
    (value.tag === "Record" || value.tag === "Array") && hasChildren()
      ? (settings) => (
          <div className={"space-y-2 pt-1 mt-1"}>
            {boxProps.children(settings)}
          </div>
        )
      : boxProps.children;
  return (
    <VariableBox {...boxProps} value={value} heading={heading}>
      {children}
    </VariableBox>
  );
};
