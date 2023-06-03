import React from "react";
import { UseFormRegister } from "react-hook-form";
import * as yup from "yup";

import {
  SqLinearScale,
  SqLogScale,
  SqPowerScale,
  SqSymlogScale,
} from "@quri/squiggle-lang";
import { Checkbox, NumberInput, TextInput, Radio } from "@quri/ui";

import { FormSection } from "./ui/FormSection.js";
import { FormComment } from "./ui/FormComment.js";
import { functionChartDefaults } from "./FunctionChart/utils.js";
import { defaultTickFormatSpecifier } from "../lib/draw/index.js";

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

const scaleTypes = ["linear", "log", "symlog", "exp"] as const;
type ScaleType = (typeof scaleTypes)[number];

function scaleTypeToSqScale(
  scaleType: ScaleType,
  args: { min?: number; max?: number; tickFormat?: string } = {}
) {
  switch (scaleType) {
    case "linear":
      return SqLinearScale.create(args);
    case "log":
      return SqLogScale.create(args);
    case "symlog":
      return SqSymlogScale.create(args);
    case "exp":
      return SqPowerScale.create({ exponent: 0.1, ...args });
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
  tickFormat: yup.string().required().default(defaultTickFormatSpecifier),
  showSummary: yup.boolean().required().default(true),
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
    tickFormat: settings.tickFormat,
  });
  const yScale = scaleTypeToSqScale(settings.yScale, {
    tickFormat: settings.tickFormat,
  });
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
    <div className="space-y-6 p-3 divide-y divide-gray-200">
      <FormSection title="General Display Settings">
        <div className="space-y-4">
          <NumberInput
            name="chartHeight"
            register={register}
            label="Chart Height (in pixels)"
          />
        </div>
      </FormSection>

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
      <FormSection title="Distribution Display Settings">
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
                  id: "symlog",
                  name: "Symlog",
                  tooltip:
                    "Almost logarithmic scale that supports negative values.",
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
          <NumberInput
            name="distributionChartSettings.minX"
            register={register}
            label="Min X Value"
          />
          <NumberInput
            name="distributionChartSettings.maxX"
            register={register}
            label="Max X Value"
          />
          <TextInput
            name="distributionChartSettings.title"
            register={register}
            label="Title"
          />
          <TextInput
            name="distributionChartSettings.tickFormat"
            register={register}
            label="Tick Format"
          />
        </div>
      </FormSection>
    </div>
  );
};

export const FunctionViewSettingsForm: React.FC<{
  register: UseFormRegister<ViewSettings>;
  fixed?: PartialViewSettings;
}> = ({ register, fixed }) => (
  <div className="pt-8">
    <FormSection title="Function Display Settings">
      <div className="space-y-6">
        <FormComment>
          When displaying functions of single variables that return numbers or
          distributions, we need to use defaults for the x-axis. We need to
          select a minimum and maximum value of x to sample, and a number n of
          the number of points to sample.
        </FormComment>
        <div className="space-y-4">
          <NumberInput
            name="functionChartSettings.start"
            register={register}
            fixed={fixed?.functionChartSettings?.start}
            label="Min X Value"
          />
          <NumberInput
            name="functionChartSettings.stop"
            register={register}
            fixed={fixed?.functionChartSettings?.stop}
            label="Max X Value"
          />
          <NumberInput
            name="functionChartSettings.count"
            register={register}
            label="Points between X min and X max to sample"
          />
        </div>
      </div>
    </FormSection>
  </div>
);
