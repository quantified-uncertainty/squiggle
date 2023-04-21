import { SqLinearScale, SqLogScale, SqPowerScale } from "@quri/squiggle-lang";
import React from "react";
import { UseFormRegister } from "react-hook-form";
import * as yup from "yup";
import { Checkbox } from "./ui/Checkbox.js";
import { HeadedSection } from "./ui/HeadedSection.js";
import { InputItem } from "./ui/InputItem.js";
import { Radio } from "./ui/Radio.js";
import { Text } from "./ui/Text.js";
import { functionChartDefaults } from "./FunctionChart/utils.js";

export const functionSettingsSchema = yup.object({}).shape({
  start: yup
    .number()
    .required()
    .positive()
    .integer()
    .default(functionChartDefaults.min)
    .min(0),
  stop: yup
    .number()
    .required()
    .positive()
    .integer()
    .default(functionChartDefaults.max)
    .min(0),
  count: yup
    .number()
    .required()
    .positive()
    .integer()
    .default(functionChartDefaults.points)
    .min(2),
});

const scaleTypes = ["linear", "log", "exp"] as const;
type ScaleType = (typeof scaleTypes)[number];

function scaleTypeToSqScale(
  scaleType: ScaleType,
  minMax: { min?: number; max?: number } = {}
) {
  switch (scaleType) {
    case "linear":
      return SqLinearScale.create(minMax);
    case "log":
      return SqLogScale.create(minMax);
    case "exp":
      return SqPowerScale.create({ exponent: 0.1, ...minMax });
    default:
      // should never happen, just a precaution
      throw new Error("Internal error");
  }
}

export const distributionSettingsSchema = yup.object({}).shape({
  /** Set the x scale to be logarithmic */
  disableLogX: yup.boolean(),
  xScale: yup.mixed<ScaleType>().oneOf(scaleTypes).default("linear"),
  yScale: yup.mixed<ScaleType>().oneOf(scaleTypes).default("linear"),
  /** Set the y scale to be exponential */
  expY: yup.boolean().required().default(false),
  minX: yup.number(),
  maxX: yup.number(),
  title: yup.string(),
  xAxisType: yup
    .mixed<"number" | "dateTime">()
    .oneOf(["number", "dateTime"])
    .default("number"),
  /** Documented here: https://github.com/d3/d3-format */
  tickFormat: yup.string().required().default(".9~s"),
  showSummary: yup.boolean().required().default(false),
});

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

// partial params for SqDistributionsPlot.create; TODO - infer explicit type?
export function generateDistributionPlotSettings(
  settings: yup.InferType<typeof distributionSettingsSchema>
) {
  const xScale = scaleTypeToSqScale(settings.xScale, {
    min: settings.minX,
    max: settings.maxX,
  });
  const yScale = scaleTypeToSqScale(settings.yScale);
  return {
    xScale,
    yScale,
    showSummary: settings.showSummary,
    title: settings.title,
  };
}

// partial params for SqFnPlot.create; TODO - infer explicit type?
export function generateFunctionPlotSettings(settings: ViewSettings) {
  const xScale = SqLinearScale.create({
    min: settings.functionChartSettings.start,
    max: settings.functionChartSettings.stop,
  });
  return { xScale, points: settings.functionChartSettings.count };
}

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
        <div className="space-y-2">
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
          distributions, we need to use defaults for the x-axis. We need to
          select a minimum and maximum value of x to sample, and a number n of
          the number of points to sample.
        </Text>
        <div className="space-y-4">
          <InputItem
            type="number"
            name="functionChartSettings.start"
            register={register}
            fixed={fixed?.functionChartSettings?.start}
            label="Min X Value"
          />
          <InputItem
            type="number"
            name="functionChartSettings.stop"
            register={register}
            fixed={fixed?.functionChartSettings?.stop}
            label="Max X Value"
          />
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
