import React from "react";
import * as yup from "yup";
import { UseFormRegister } from "react-hook-form";
import { InputItem } from "./ui/InputItem";
import { Checkbox } from "./ui/Checkbox";
import { HeadedSection } from "./ui/HeadedSection";
import { Text } from "./ui/Text";
import { MergedItemSettings, LocalItemSettings } from "./SquiggleViewer/utils";
import { distributionSettingsSchema } from "./DistributionChart";

export const viewSettingsSchema = yup
  .object({})
  .shape({
    diagramStart: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(0)
      .min(0),
    diagramStop: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(10)
      .min(0),
    diagramCount: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(20)
      .min(2),
  })
  .concat(distributionSettingsSchema);

export type EditableViewSettings = yup.InferType<typeof viewSettingsSchema>;

export const mergedToViewSettings = (
  settings: MergedItemSettings
): EditableViewSettings => ({
  ...settings,
  ...settings.distributionChartSettings,
  diagramStart: settings.functionChartSettings.start,
  diagramStop: settings.functionChartSettings.stop,
  diagramCount: settings.functionChartSettings.count,
});
export const viewSettingsToMerged = (
  settings: EditableViewSettings
): Omit<MergedItemSettings, "environment"> => ({
  distributionChartSettings: { ...settings },
  functionChartSettings: {
    start: settings.diagramStart,
    stop: settings.diagramStop,
    count: settings.diagramCount,
  },
  chartHeight: settings.chartHeight,
});

// Annoyingly, this has the exact same body as above, however I can't work
// out how to convince typescript that it's a duplication. The only way I can think
// of removing this is by making EditableViewSettings and Omit<MergedItemSettings, "environment> the same object and removing the need for both these functions
export const viewSettingsToLocal = (
  settings: Partial<EditableViewSettings>
): Omit<LocalItemSettings, "collapsed" | "environment"> => ({
  distributionChartSettings: { ...settings },
  functionChartSettings: {
    start: settings.diagramStart,
    stop: settings.diagramStop,
    count: settings.diagramCount,
  },
  chartHeight: settings.chartHeight,
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
            name="vegaActions"
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
