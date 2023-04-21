import React from "react";
import { UseFormRegister } from "react-hook-form";
import * as yup from "yup";
import { distributionSettingsSchema } from "./DistributionsChart/index.js";
import { HeadedSection } from "./ui/HeadedSection.js";
import { InputItem } from "./ui/InputItem.js";
import { Text } from "./ui/Text.js";

export const viewSettingsSchema = yup.object({}).shape({
  distributionChartSettings: distributionSettingsSchema,
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
        <Text>
          Distribution plots can now be configured with arguments to{" "}
          <code>Plot.dist</code>
          and <code>Plot.dists</code> functions.
        </Text>
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
      <Text>
        When displaying functions of single variables that return numbers or
        distributions, we use <code>[0..10]</code> range by default. To
        customize the range, use <code>Plot.fn</code> function.
      </Text>
    </HeadedSection>
  </div>
);
