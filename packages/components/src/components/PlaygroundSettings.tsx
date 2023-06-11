import React from "react";
import { z } from "zod";

import {
  SqLinearScale,
  SqLogScale,
  SqPowerScale,
  SqSymlogScale,
} from "@quri/squiggle-lang";
import {
  CheckboxFormField,
  NumberFormField,
  RadioFormField,
  TextFormField,
} from "@quri/ui";

import { defaultTickFormatSpecifier } from "../lib/draw/index.js";
import { functionChartDefaults } from "./FunctionChart/utils.js";
import { FormComment } from "./ui/FormComment.js";
import { FormSection } from "./ui/FormSection.js";

export const renderingSettingsSchema = z.object({
  sampleCount: z.number().int().gte(10).lte(1000000).default(1000),
  xyPointLength: z.number().int().gte(10).lte(10000).default(1000),
});

export const functionSettingsSchema = z.object({
  start: z.number().finite().default(functionChartDefaults.min),
  stop: z.number().finite().default(functionChartDefaults.max),
  count: z.number().int().finite().gte(2).default(functionChartDefaults.points),
});

const scaleSchema = z
  .union([
    z.literal("linear"),
    z.literal("log"),
    z.literal("symlog"),
    z.literal("exp"),
  ])
  .default("linear");

type ScaleType = z.infer<typeof scaleSchema>;

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

export const distributionSettingsSchema = z.object({
  /** Set the x scale to be logarithmic */
  disableLogX: z.boolean().optional(),
  xScale: scaleSchema,
  yScale: scaleSchema,
  minX: z.number().optional(),
  maxX: z.number().optional(),
  title: z.string().optional(),
  xAxisType: z
    .union([z.literal("number"), z.literal("dateTime")])
    .default("number"),
  /** Documented here: https://github.com/d3/d3-format */
  tickFormat: z.string().default(defaultTickFormatSpecifier),
  showSummary: z.boolean().default(true),
});

export const viewSettingsSchema = z.object({
  renderingSettings: renderingSettingsSchema.default(
    renderingSettingsSchema.parse({})
  ),
  distributionChartSettings: distributionSettingsSchema.default(
    distributionSettingsSchema.parse({})
  ),
  functionChartSettings: functionSettingsSchema.default(
    functionSettingsSchema.parse({})
  ),
  chartHeight: z.number().int().finite().gte(10).lte(5000).default(200),
});

export type PlaygroundSettings = z.infer<typeof viewSettingsSchema>;

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type PartialPlaygroundSettings = DeepPartial<PlaygroundSettings>;

// partial params for SqDistributionsPlot.create; TODO - infer explicit type?
export function generateDistributionPlotSettings(
  settings: z.infer<typeof distributionSettingsSchema>
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
export function generateFunctionPlotSettings(settings: PlaygroundSettings) {
  const xScale = SqLinearScale.create({
    min: settings.functionChartSettings.start,
    max: settings.functionChartSettings.stop,
  });
  return { xScale, points: settings.functionChartSettings.count };
}

export const RenderingSettingsForm: React.FC = () => (
  <div className="space-y-4">
    <NumberFormField<PlaygroundSettings>
      name="renderingSettings.sampleCount"
      label="Sample Count"
      description="How many samples to use for Monte Carlo simulations. This can occasionally be overridden by specific Squiggle programs."
    />
    <NumberFormField<PlaygroundSettings>
      name="renderingSettings.xyPointLength"
      label="Coordinate Count (For PointSet Shapes)"
      description="When distributions are converted into PointSet shapes, we need to know how many coordinates to use."
    />
  </div>
);

export const DistributionSettingsForm: React.FC<{
  fixed?: PartialPlaygroundSettings;
}> = ({ fixed }) => {
  return (
    <FormSection title="Distribution Display Settings">
      <div className="space-y-4">
        <CheckboxFormField<PlaygroundSettings>
          name="distributionChartSettings.showSummary"
          label="Show summary statistics"
        />
        <RadioFormField<PlaygroundSettings>
          name="distributionChartSettings.xScale"
          label="X Scale"
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
        <RadioFormField<PlaygroundSettings>
          name="distributionChartSettings.yScale"
          label="Y Scale"
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
        <NumberFormField<PlaygroundSettings>
          name="distributionChartSettings.minX"
          label="Min X Value"
        />
        <NumberFormField<PlaygroundSettings>
          name="distributionChartSettings.maxX"
          label="Max X Value"
        />
        <TextFormField<PlaygroundSettings>
          name="distributionChartSettings.title"
          label="Title"
        />
        <TextFormField<PlaygroundSettings>
          name="distributionChartSettings.tickFormat"
          label="Tick Format"
        />
      </div>
    </FormSection>
  );
};

export const FunctionSettingsForm: React.FC = () => {
  return (
    <FormSection title="Function Display Settings">
      <div className="space-y-6">
        <FormComment>
          When displaying functions of single variables that return numbers or
          distributions, we need to use defaults for the x-axis. We need to
          select a minimum and maximum value of x to sample, and a number n of
          the number of points to sample.
        </FormComment>
        <div className="space-y-4">
          <NumberFormField<PlaygroundSettings>
            name="functionChartSettings.start"
            label="Min X Value"
          />
          <NumberFormField<PlaygroundSettings>
            name="functionChartSettings.stop"
            label="Max X Value"
          />
          <NumberFormField<PlaygroundSettings>
            name="functionChartSettings.count"
            label="Points between X min and X max to sample"
          />
        </div>
      </div>
    </FormSection>
  );
};

export const PlaygroundSettingsForm: React.FC<{
  withFunctionSettings?: boolean;
  withGlobalSettings?: boolean;
  fixed?: PartialPlaygroundSettings;
}> = ({ withGlobalSettings = true, withFunctionSettings = true, fixed }) => {
  return (
    <div className="divide-y divide-gray-200 max-w-2xl">
      {withGlobalSettings && (
        <>
          <div className="mb-6">
            <FormSection title="Rendering Settings">
              <RenderingSettingsForm />
            </FormSection>
          </div>

          <div className="pt-6 mb-6">
            <FormSection title="General Display Settings">
              <NumberFormField<PlaygroundSettings>
                name="chartHeight"
                label="Chart Height (in pixels)"
              />
            </FormSection>
          </div>
        </>
      )}

      <div className="pt-6 mb-6">
        <DistributionSettingsForm fixed={fixed} />
      </div>

      {withFunctionSettings ? (
        <div className="pt-6 mb-6">
          <FunctionSettingsForm />
        </div>
      ) : null}
    </div>
  );
};
