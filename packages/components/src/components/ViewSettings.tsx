import React from "react";
import * as yup from "yup";
import { UseFormRegister } from "react-hook-form";
import { InputItem } from "./ui/InputItem";
import { Checkbox } from "./ui/Checkbox";
import { HeadedSection } from "./ui/HeadedSection";
import { Text } from "./ui/Text";

export const viewSettingsSchema = yup.object({}).shape({
  chartHeight: yup.number().required().positive().integer().default(350),
  showEditor: yup.boolean().required(),
  plotSettings: yup.object({
    showSummary: yup.boolean().required(),
    logX: yup.boolean().required(),
    expY: yup.boolean().required(),
    tickFormat: yup.string().required(),
    title: yup.string().default(""),
    color: yup.string().required(),
    minX: yup.number(),
    maxX: yup.number(),
    actions: yup.boolean().required(),
  }),
  functionSettings: yup.object({
    start: yup.number().required().positive().integer().default(0).min(0),
    stop: yup.number().required().positive().integer().default(10).min(0),
    count: yup.number().required().positive().integer().default(20).min(2),
  }),
});

export type ViewSettingsFormFields = yup.InferType<typeof viewSettingsSchema>;

// This component is used in two places: for global settings in SquigglePlayground, and for item-specific settings in modal dialogs.
export const ViewSettings: React.FC<{
  withShowEditorSetting?: boolean;
  withFunctionSettings?: boolean;
  disableLogXSetting?: boolean;
  register: UseFormRegister<ViewSettingsFormFields>;
}> = ({
  withShowEditorSetting = true,
  withFunctionSettings = true,
  disableLogXSetting,
  register,
}) => {
  return (
    <div className="space-y-6 p-3 divide-y divide-gray-200 max-w-xl">
      <HeadedSection title="General Display Settings">
        <div className="space-y-4">
          {withShowEditorSetting ? (
            <Checkbox
              name="showEditor"
              register={register}
              label="Show code editor on left"
            />
          ) : null}
          <InputItem
            name="chartHeight"
            type="number"
            register={register}
            label="Chart Height (in pixels)"
          />
        </div>
      </HeadedSection>

      <div className="pt-8">
        <HeadedSection title="Distribution Display Settings">
          <div className="space-y-2">
            <Checkbox
              register={register}
              name="plotSettings.logX"
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
              name="plotSettings.expY"
              label="Show y scale exponentially"
            />
            <Checkbox
              register={register}
              name="plotSettings.actions"
              label="Show vega chart controls"
            />
            <Checkbox
              register={register}
              name="plotSettings.showSummary"
              label="Show summary statistics"
            />
            <InputItem
              name="plotSettings.minX"
              type="number"
              register={register}
              label="Min X Value"
            />
            <InputItem
              name="plotSettings.maxX"
              type="number"
              register={register}
              label="Max X Value"
            />
            <InputItem
              name="plotSettings.title"
              type="text"
              register={register}
              label="Title"
            />
            <InputItem
              name="plotSettings.tickFormat"
              type="text"
              register={register}
              label="Tick Format"
            />
            <InputItem
              name="plotSettings.color"
              type="color"
              register={register}
              label="Color"
            />
          </div>
        </HeadedSection>
      </div>

      {withFunctionSettings ? (
        <div className="pt-8">
          <HeadedSection title="Function Display Settings">
            <div className="space-y-6">
              <Text>
                When displaying functions of single variables that return
                numbers or distributions, we need to use defaults for the
                x-axis. We need to select a minimum and maximum value of x to
                sample, and a number n of the number of points to sample.
              </Text>
              <div className="space-y-4">
                <InputItem
                  type="number"
                  name="functionSettings.start"
                  register={register}
                  label="Min X Value"
                />
                <InputItem
                  type="number"
                  name="functionSettings.stop"
                  register={register}
                  label="Max X Value"
                />
                <InputItem
                  type="number"
                  name="functionSettings.count"
                  register={register}
                  label="Points between X min and X max to sample"
                />
              </div>
            </div>
          </HeadedSection>
        </div>
      ) : null}
    </div>
  );
};
