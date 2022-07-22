import React from "react";
import * as yup from "yup";
import { UseFormRegister } from "react-hook-form";
import { InputItem } from "./ui/InputItem";
import { Checkbox } from "./ui/Checkbox";
import { HeadedSection } from "./ui/HeadedSection";
import { Text } from "./ui/Text";
import {
  defaultColor,
  defaultTickFormat,
} from "../lib/distributionSpecBuilder";

export const viewSettingsSchema = yup.object({}).shape({
  chartHeight: yup.number().required().positive().integer().default(350),
  showSummary: yup.boolean().required(),
  showEditor: yup.boolean().required(),
  logX: yup.boolean().required(),
  expY: yup.boolean().required(),
  tickFormat: yup.string().default(defaultTickFormat),
  title: yup.string(),
  color: yup.string().default(defaultColor).required(),
  minX: yup.number(),
  maxX: yup.number(),
  distributionChartActions: yup.boolean(),
  diagramStart: yup.number().required().positive().integer().default(0).min(0),
  diagramStop: yup.number().required().positive().integer().default(10).min(0),
  diagramCount: yup.number().required().positive().integer().default(20).min(2),
});

type FormFields = yup.InferType<typeof viewSettingsSchema>;

// This component is used in two places: for global settings in SquigglePlayground, and for item-specific settings in modal dialogs.
export const ViewSettings: React.FC<{
  withShowEditorSetting?: boolean;
  withFunctionSettings?: boolean;
  register: UseFormRegister<FormFields>;
}> = ({
  withShowEditorSetting = true,
  withFunctionSettings = true,
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
              name="logX"
              label="Show x scale logarithmically"
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
            <InputItem
              name="color"
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
      ) : null}
    </div>
  );
};
