import React, { ReactNode } from "react";

import {
  SqDistributionsPlot,
  SqPlot,
  SqScale,
  SqValue,
  SqTable,
  SqError,
  result,
} from "@quri/squiggle-lang";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";
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
import { clsx } from "clsx";

// We use an extra left margin for some elements to align them with parent variable name
const leftMargin = "ml-1.5";

const showItem = (item: result<SqValue, SqError>, settings) => {
  if (item.ok) {
    const value = item.value;
    if (valueHasContext(value)) {
      return getBoxProps(value).children(settings);
    } else {
      return value.toString();
    }
  } else {
    return item.toString();
  }
};

const table = (value: SqTable, environment, settings) => {
  const rowsAndColumns = value.items(environment);
  const columnNames = value.columnNames;

  return (
    <div className="not-prose relative rounded-sm overflow-hidden border border-slate-200">
      <table className="table-fixed w-full">
        {columnNames && (
          <thead className="text-xs text-gray-700 bg-gray-50 border-b border-slate-200">
            <tr>
              {columnNames.map((name, i) => (
                <th key={i} scope="col" className="px-4 py-2">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rowsAndColumns.map((row, i) => (
            <tr key={i} className="border-b border-slate-100">
              {row.map((item, k) => (
                <td key={k} className="px-1">
                  {showItem(item, settings)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const getBoxProps = (
  value: SqValueWithContext
): Omit<VariableBoxProps, "value"> => {
  const environment = value.context.project.getEnvironment();

  switch (value.tag) {
    case "Number":
      return {
        preview: <NumberShower precision={3} number={value.value} />,
        children: () => (
          <div className={clsx("font-semibold text-indigo-800", leftMargin)}>
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
            value.context.project.getEnvironment()
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
          <div
            className={clsx(
              "text-indigo-800 text-sm font-mono font-semibold",
              leftMargin
            )}
          >
            {value.value.toString()}
          </div>
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
            case "table":
              return table(plot, environment, settings);
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
        isRecordOrList: true,
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
        isRecordOrList: true,
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
  const foo = value;
  if (!valueHasContext(value)) {
    return <MessageAlert heading="Can't display pathless value" />;
  }
  const bar = value;

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
