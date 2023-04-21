import React from "react";
import * as yup from "yup";
import { UseFormRegister } from "react-hook-form";
import { InputItem } from "./ui/InputItem.js";
import { Checkbox } from "./ui/Checkbox.js";
import { HeadedSection } from "./ui/HeadedSection.js";
import { Text } from "./ui/Text.js";
import { distributionSettingsSchema } from "./MultiDistributionChart/index.js";
import { functionSettingsSchema } from "./FunctionChart/index.js";
import { Radio } from "./ui/Radio.js";

export const viewSettingsSchema = yup.object({}).shape({
  distributionChartSettings: distributionSettingsSchema,
  functionChartSettings: functionSettingsSchema,
  chartHeight: yup.number().required().positive().integer().default(200),
});

export type ViewSettings = yup.InferType<typeof viewSettingsSchema>;

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type PartialViewSettings = DeepPartial<ViewSettings>;

export const ViewSettingsForm: React.FC<{
  withFunctionSettings?: boolean;
  fixed?: PartialViewSettings;
  register: UseFormRegister<ViewSettings>;
}> = ({ withFunctionSettings = true, fixed, register }) => {
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

      <DistributionViewSettingsForm fixed={fixed} register={register} />

      {withFunctionSettings ? (
        <FunctionViewSettingsForm fixed={fixed} register={register} />
      ) : null}
    </div>
  );
};

export const DistributionViewSettingsForm: React.FC<{
  register: UseFormRegister<ViewSettings>;
  fixed?: PartialViewSettings;
}> = ({ register, fixed }) => {
  return (
    <div className="pt-8">
      <HeadedSection title="Distribution Display Settings">
        <div className="space-y-4">
          <Checkbox
            register={register}
            name="distributionChartSettings.showSummary"
            label="Show summary statistics"
          />
          <div className="space-y-2">
            <Radio
              register={register}
              name="distributionChartSettings.xScale"
              label="X Scale"
              initialId={fixed?.distributionChartSettings?.xScale ?? "linear"}
              options={[
                {
                  id: "linear",
                  name: "Linear",
                },
                {
                  id: "log",
                  name: "Logarithmic",
                  ...(fixed?.distributionChartSettings?.disableLogX
                    ? {
                        disabled: true,
                        tooltip:
                          "Your distribution has mass lower than or equal to 0. Log only works on strictly positive values.",
                      }
                    : null),
                },
                {
                  id: "exp",
                  name: "Exponential",
                },
              ]}
            />
            <Radio
              register={register}
              name="distributionChartSettings.yScale"
              label="Y Scale"
              initialId={fixed?.distributionChartSettings?.yScale ?? "linear"}
              options={[
                {
                  id: "linear",
                  name: "Linear",
                },
                // log Y is hidden because it almost always causes an empty chart
                {
                  id: "exp",
                  name: "Exponential",
                },
              ]}
            />
          </div>
          <InputItem
            name="distributionChartSettings.minX"
            type="number"
            register={register}
            label="Min X Value"
          />
          <InputItem
            name="distributionChartSettings.maxX"
            type="number"
            register={register}
            label="Max X Value"
          />
          <InputItem
            name="distributionChartSettings.title"
            type="text"
            register={register}
            label="Title"
          />
          <InputItem
            name="distributionChartSettings.tickFormat"
            type="text"
            register={register}
            label="Tick Format"
          />
        </div>
      </HeadedSection>
    </div>
  );
};

export const FunctionViewSettingsForm: React.FC<{
  register: UseFormRegister<ViewSettings>;
  fixed?: PartialViewSettings;
}> = ({ register, fixed }) => (
  <div className="pt-8">
    <HeadedSection title="Function Display Settings">
      <div className="space-y-6">
        <Text>
          When displaying functions of single variables that return numbers or
          distributions, use [0..10] range by default. To customize the range,
          use <code>Plot.fn</code> function.
        </Text>
        <div>
          <InputItem
            type="number"
            name="functionChartSettings.count"
            register={register}
            label="Points between X min and X max to sample"
          />
        </div>
      </div>
    </HeadedSection>
  </div>
);
