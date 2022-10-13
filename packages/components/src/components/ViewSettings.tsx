import React from "react";
import * as yup from "yup";
import { UseFormRegister } from "react-hook-form";
import { InputItem } from "./ui/InputItem";
import { Checkbox } from "./ui/Checkbox";
import { HeadedSection } from "./ui/HeadedSection";
import { Text } from "./ui/Text";
import { MergedItemSettings, LocalItemSettings } from "./SquiggleViewer/utils";
import { defaultTickFormat } from "../lib/distributionSpecBuilder";

export const viewSettingsSchema = yup.object({}).shape({
  chartHeight: yup.number().required().positive().integer().default(350),
  showSummary: yup.boolean().required().default(false),
  logX: yup.boolean().required().default(false),
  expY: yup.boolean().required().default(false),
  tickFormat: yup.string().required().default(defaultTickFormat),
  title: yup.string(),
  minX: yup.number(),
  maxX: yup.number(),
  xAxisType: yup
    .mixed<"number" | "dateTime">()
    .oneOf(["number", "dateTime"])
    .default("number"),
  distributionChartActions: yup.boolean(),
  diagramStart: yup.number().required().positive().integer().default(0).min(0),
  diagramStop: yup.number().required().positive().integer().default(10).min(0),
  diagramCount: yup.number().required().positive().integer().default(20).min(2),
});

export type EditableViewSettings = yup.InferType<typeof viewSettingsSchema>;

export const viewSettingsToMerged = (
  settings: EditableViewSettings
): Omit<MergedItemSettings, "environment"> => {
  const {
    showSummary,
    logX,
    expY,
    diagramStart,
    diagramStop,
    diagramCount,
    tickFormat,
    minX,
    maxX,
    title,
    xAxisType,
    distributionChartActions,
    chartHeight,
  } = settings;

  const distributionPlotSettings = {
    showSummary,
    logX,
    expY,
    format: tickFormat,
    minX,
    maxX,
    title,
    xAxisType,
    actions: distributionChartActions,
  };

  const chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };

  return { distributionPlotSettings, chartSettings, chartHeight };
};

export const viewSettingsToLocal = (
  settings: Partial<EditableViewSettings>
): Omit<LocalItemSettings, "collapsed" | "environment"> => {
  const {
    showSummary,
    logX,
    expY,
    diagramStart,
    diagramStop,
    diagramCount,
    tickFormat,
    minX,
    maxX,
    title,
    xAxisType,
    distributionChartActions,
    chartHeight,
  } = settings;

  const distributionPlotSettings = {
    showSummary,
    logX,
    expY,
    format: tickFormat,
    minX,
    maxX,
    title,
    xAxisType,
    actions: distributionChartActions,
  };

  const chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };

  return { distributionPlotSettings, chartSettings, chartHeight };
};

export const mergedToViewSettings = (
  mergedSettings: MergedItemSettings
): EditableViewSettings => ({
  chartHeight: mergedSettings.chartHeight,
  showSummary: mergedSettings.distributionPlotSettings.showSummary,
  logX: mergedSettings.distributionPlotSettings.logX,
  expY: mergedSettings.distributionPlotSettings.expY,
  tickFormat: mergedSettings.distributionPlotSettings.format,
  title: mergedSettings.distributionPlotSettings.title,
  minX: mergedSettings.distributionPlotSettings.minX,
  maxX: mergedSettings.distributionPlotSettings.maxX,
  distributionChartActions: mergedSettings.distributionPlotSettings.actions,
  xAxisType: mergedSettings.distributionPlotSettings.xAxisType,
  diagramStart: mergedSettings.chartSettings.start,
  diagramStop: mergedSettings.chartSettings.stop,
  diagramCount: mergedSettings.chartSettings.count,
});

export const ViewSettings: React.FC<{
  withFunctionSettings?: boolean;
  disableLogXSetting?: boolean;
  register: UseFormRegister<EditableViewSettings>;
}> = ({ withFunctionSettings = true, disableLogXSetting, register }) => {
  return (
    <div className="space-y-6 p-3 divide-y divide-gray-200 max-w-xl">
      <HeadedSection title="General Display Settings">
        <div className="space-y-4">
          <InputItem
            name="chartHeight"
            type="number"
            register={register}
            label="Chart Height (in pixels)"
          />
        </div>
      </HeadedSection>

      <DistributionViewSettings
        disableLogXSetting={disableLogXSetting}
        register={register}
      />

      {withFunctionSettings ? (
        <FunctionViewSettings register={register} />
      ) : null}
    </div>
  );
};

export const DistributionViewSettings: React.FC<{
  disableLogXSetting?: boolean;
  register: UseFormRegister<EditableViewSettings>;
}> = ({ disableLogXSetting, register }) => {
  return (
    <div className="pt-8">
      <HeadedSection title="Distribution Display Settings">
        <div className="space-y-2">
          <Checkbox
            register={register}
            name="logX"
            label="Show x scale logarithmically"
            disabled={disableLogXSetting}
            tooltip={
              disableLogXSetting
                ? "Your distribution has mass lower than or equal to 0. Log only works on strictly positive values."
                : undefined
            }
          />
          <Checkbox
            register={register}
            name="expY"
            label="Show y scale exponentially"
          />
          <Checkbox
            register={register}
            name="distributionChartActions"
            label="Show vega chart controls"
          />
          <Checkbox
            register={register}
            name="showSummary"
            label="Show summary statistics"
          />
          <InputItem
            name="minX"
            type="number"
            register={register}
            label="Min X Value"
          />
          <InputItem
            name="maxX"
            type="number"
            register={register}
            label="Max X Value"
          />
          <InputItem
            name="title"
            type="text"
            register={register}
            label="Title"
          />
          <InputItem
            name="tickFormat"
            type="text"
            register={register}
            label="Tick Format"
          />
        </div>
      </HeadedSection>
    </div>
  );
};

export const FunctionViewSettings: React.FC<{
  register: UseFormRegister<EditableViewSettings>;
}> = ({ register }) => (
  <div className="pt-8">
    <HeadedSection title="Function Display Settings">
      <div className="space-y-6">
        <Text>
          When displaying functions of single variables that return numbers or
          distributions, we need to use defaults for the x-axis. We need to
          select a minimum and maximum value of x to sample, and a number n of
          the number of points to sample.
        </Text>
        <div className="space-y-4">
          <InputItem
            type="number"
            name="diagramStart"
            register={register}
            label="Min X Value"
          />
          <InputItem
            type="number"
            name="diagramStop"
            register={register}
            label="Max X Value"
          />
          <InputItem
            type="number"
            name="diagramCount"
            register={register}
            label="Points between X min and X max to sample"
          />
        </div>
      </div>
    </HeadedSection>
  </div>
);
