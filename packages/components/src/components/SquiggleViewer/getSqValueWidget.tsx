import { clsx } from "clsx";
import { FC, ReactNode } from "react";
import ReactMarkdown from "react-markdown";

import { SqDistributionsPlot, SqValue } from "@quri/squiggle-lang";
import { TableCellsIcon } from "@quri/ui";

import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import { SqValueWithContext } from "../../lib/utility.js";
import {
  Calculator,
  CalculatorSampleCountValidation,
} from "../Calculator/index.js";
import { DistPreview } from "../DistributionsChart/DistPreview.js";
import { DistributionsChart } from "../DistributionsChart/index.js";
import { DistFunctionChart } from "../FunctionChart/DistFunctionChart.js";
import { NumericFunctionChart } from "../FunctionChart/NumericFunctionChart.js";
import { FunctionChart } from "../FunctionChart/index.js";
import { NumberShower } from "../NumberShower.js";
import {
  PlaygroundSettings,
  generateDistributionPlotSettings,
} from "../PlaygroundSettings.js";
import { RelativeValuesGridChart } from "../RelativeValuesGridChart/index.js";
import { ScatterChart } from "../ScatterChart/index.js";
import { TableChart } from "../TableChart/index.js";
import { ItemSettingsMenu } from "./ItemSettingsMenu.js";
import { ValueViewer } from "./ValueViewer.js";
import { SettingsMenuParams } from "./ValueWithContextViewer.js";

// Distributions should be smaller than the other charts.
// Note that for distributions, this only applies to the internals, there's also extra margin and details.
const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;

// We use an extra left margin for some elements to align them with parent variable name
const leftMargin = "ml-1.5";

const truncateStr = (str: string, maxLength: number) =>
  str.substring(0, maxLength) + (str.length > maxLength ? "..." : "");

export const SqTypeWithCount: FC<{
  type: string;
  count: number;
}> = ({ type, count }) => (
  <div>
    {type}
    <span className="ml-0.5">{count}</span>
  </div>
);

type ValueByTag<T extends SqValue["tag"]> = Extract<
  SqValueWithContext,
  { tag: T }
>;

export type ValueWidget<T extends SqValue["tag"] = SqValue["tag"]> = {
  heading?: (value: ValueByTag<T>) => string;
  renderPreview?: (value: ValueByTag<T>) => ReactNode;
  renderSettingsMenu?: (
    value: ValueByTag<T>,
    params: SettingsMenuParams
  ) => ReactNode;
  render: (value: ValueByTag<T>, settings: PlaygroundSettings) => ReactNode;
};

const numberWidget: ValueWidget<"Number"> = {
  renderPreview: (value) => <NumberShower precision={4} number={value.value} />,
  render: (value) => (
    <div className={clsx("font-semibold text-indigo-800", leftMargin)}>
      <NumberShower precision={4} number={value.value} />
    </div>
  ),
};

const distWidget: ValueWidget<"Dist"> = {
  renderPreview: (value) => (
    <DistPreview
      dist={value.value}
      environment={value.context.project.getEnvironment()}
    />
  ),
  renderSettingsMenu: (value, { onChange }) => {
    const shape = value.value.pointSet(value.context.project.getEnvironment());

    return (
      <ItemSettingsMenu
        value={value}
        onChange={onChange}
        metaSettings={{
          disableLogX: shape?.ok && hasMassBelowZero(shape.value.asShape()),
        }}
        withFunctionSettings={false}
      />
    );
  },
  render: (value, settings) => {
    const plot = SqDistributionsPlot.create({
      distribution: value.value,
      ...generateDistributionPlotSettings(settings.distributionChartSettings),
    });

    return (
      <DistributionsChart
        plot={plot}
        environment={value.context.project.getEnvironment()}
        height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
      />
    );
  },
};

const stringWidget: ValueWidget<"String"> = {
  renderPreview: (value) => (
    <div className="overflow-ellipsis overflow-hidden">
      {truncateStr(value.value, 20)}
    </div>
  ),
  render: (value) => (
    <div className="text-neutral-800 text-sm px-2 py-1 my-1">
      <ReactMarkdown className="prose max-w-4xl">{value.value}</ReactMarkdown>
    </div>
  ),
};

const boolWidget: ValueWidget<"Bool"> = {
  renderPreview: (value) => value.value.toString(),
  render: (value) => (
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

const dateWidget: ValueWidget<"Date"> = {
  render: (value) => value.value.toDateString(),
};

const voidWidget: ValueWidget<"Void"> = {
  render: () => "Void",
};

const timeDurationWidget: ValueWidget<"TimeDuration"> = {
  render: (value) => <NumberShower precision={3} number={value.value} />,
};

const calculatorWidget: ValueWidget<"Calculator"> = {
  render: (value, settings) => (
    <CalculatorSampleCountValidation calculator={value}>
      <Calculator valueWithContext={value} settings={settings} />
    </CalculatorSampleCountValidation>
  ),
};

const tableChartWidget: ValueWidget<"TableChart"> = {
  renderPreview: (value) => (
    <div className="items-center flex space-x-1">
      <TableCellsIcon size={14} className="flex opacity-60" />
      <div>
        {value.value.rowCount}
        <span className="opacity-60">x</span>
        {value.value.columnCount}
      </div>
    </div>
  ),
  render: (value, settings) => (
    <TableChart
      value={value.value}
      environment={value.context.project.getEnvironment()}
      settings={settings}
    />
  ),
};

const lambdaWidget: ValueWidget<"Lambda"> = {
  renderPreview: (value) => (
    <div>
      fn(
      <span className="opacity-60">
        {truncateStr(value.value.parameterString(), 15)}
      </span>
      )
    </div>
  ),
  renderSettingsMenu: (value, { onChange }) => {
    return (
      <ItemSettingsMenu
        value={value}
        onChange={onChange}
        withFunctionSettings={true}
      />
    );
  },
  render: (value, settings) => {
    const environment = value.context.project.getEnvironment();
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
  },
};

const plotWidget: ValueWidget<"Plot"> = {
  render: (value, settings) => {
    const plot = value.value;
    const environment = value.context.project.getEnvironment();

    switch (plot.tag) {
      case "distributions":
        return (
          <DistributionsChart
            plot={plot}
            environment={environment}
            height={settings.chartHeight * CHART_TO_DIST_HEIGHT_ADJUSTMENT}
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
            environment={{
              sampleCount: environment.sampleCount / 10,
              xyPointLength: environment.xyPointLength / 10,
            }}
            height={settings.chartHeight}
          />
        );
      }
      case "scatter":
        return (
          <ScatterChart
            plot={plot}
            environment={environment}
            height={settings.chartHeight}
          />
        );
      case "relativeValues":
        return (
          <RelativeValuesGridChart plot={plot} environment={environment} />
        );
      default:
        // can happen if squiggle-lang version is too fresh and we messed up the components -> squiggle-lang dependency
        return `Unsupported plot ${plot satisfies never}`;
    }
  },
};

const scaleWidget: ValueWidget<"Scale"> = {
  render: (value) => <div>{value.value.toString()}</div>,
};

const dictWidget: ValueWidget<"Dict"> = {
  heading: (value) => `Dict(${value.value.entries().length})`,
  renderPreview: (value) => (
    <SqTypeWithCount type="{}" count={value.value.entries().length} />
  ),
  render: (value) => (
    <div className="space-y-2 pt-1 mt-1">
      {value.value.entries().map(([k, v]) => (
        <ValueViewer key={k} value={v} />
      ))}
    </div>
  ),
};

const arrayWidget: ValueWidget<"Array"> = {
  heading: (value) => `List(${value.value.getValues().length})`,
  renderPreview: (value) => (
    <SqTypeWithCount type="[]" count={value.value.getValues().length} />
  ),
  render: (value) => (
    <div className="space-y-2 pt-1 mt-1">
      {value.value.getValues().map((r, i) => (
        <ValueViewer key={i} value={r} />
      ))}
    </div>
  ),
};

const domainWidget: ValueWidget<"Domain"> = {
  // TODO - same styles as `Boolean`?
  render: (value) => value.toString(),
};

const inputWidget: ValueWidget<"Input"> = {
  render: (value) => value.toString(),
};

export const widgetByType: { [K in SqValue["tag"]]: ValueWidget<K> } = {
  Number: numberWidget,
  Dist: distWidget,
  String: stringWidget,
  Bool: boolWidget,
  Date: dateWidget,
  Void: voidWidget,
  TimeDuration: timeDurationWidget,
  Calculator: calculatorWidget,
  TableChart: tableChartWidget,
  Lambda: lambdaWidget,
  Plot: plotWidget,
  Scale: scaleWidget,
  Dict: dictWidget,
  Array: arrayWidget,
  Domain: domainWidget,
  Input: inputWidget,
};

const unknownValueWidget: ValueWidget = {
  heading: () => "Error",
  render: (value) => (
    <div>
      <span>No display for type: </span>{" "}
      <span className="font-semibold text-neutral-600">{value.tag}</span>
    </div>
  ),
};

export function getSqValueWidget<const T extends SqValue["tag"]>(
  valueTag: T
): ValueWidget<T> {
  return widgetByType[valueTag] ?? unknownValueWidget;
}
