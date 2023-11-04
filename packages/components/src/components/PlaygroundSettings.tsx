import React from "react";
import { z } from "zod";

import {
  SqLinearScale,
  SqLogScale,
  SqPowerScale,
  SqSymlogScale,
} from "@quri/squiggle-lang";
import { CheckboxFormField, NumberFormField, RadioFormField } from "@quri/ui";

import { functionChartDefaults } from "./FunctionChart/utils.js";
import { FormComment } from "./ui/FormComment.js";
import { FormSection } from "./ui/FormSection.js";
import { SAMPLE_COUNT_MAX, SAMPLE_COUNT_MIN } from "../lib/constants.js";

export const environmentSchema = z.object({
  sampleCount: z.number().int().gte(SAMPLE_COUNT_MIN).lte(SAMPLE_COUNT_MAX),
  xyPointLength: z.number().int().gte(10).lte(10000),
});

export const functionSettingsSchema = z.object({
  start: z.number().finite(),
  stop: z.number().finite(),
  count: z.number().int().finite(),
});

export const editorSettings = z.object({
  lineWrapping: z.boolean(),
});

const scaleSchema = z.union([
  z.literal("linear"),
  z.literal("log"),
  z.literal("symlog"),
  z.literal("exp"),
]);

type ScaleType = z.infer<typeof scaleSchema>;

function scaleTypeToSqScale(
  scaleType: ScaleType,
  args: { min?: number; max?: number } = {}
) {
  switch (scaleType) {
    case "linear":
      return SqLinearScale.create(args);
    case "log":
      return SqLogScale.create(args);
    case "symlog":
      return SqSymlogScale.create(args);
    case "exp":
      return SqPowerScale.create(args);
    default:
      // should never happen, just a precaution
      throw new Error("Internal error");
  }
}

export const distributionSettingsSchema = z.object({
  xScale: scaleSchema,
  yScale: scaleSchema,
  minX: z.number().optional(),
  maxX: z.number().optional(),
  title: z.string().optional(),
  showSummary: z.boolean(),
});

export const viewSettingsSchema = z.object({
  environment: environmentSchema,
  distributionChartSettings: distributionSettingsSchema,
  functionChartSettings: functionSettingsSchema,
  editorSettings: editorSettings,
  chartHeight: z.number().int().finite().gte(10).lte(5000),
});

export type PlaygroundSettings = z.infer<typeof viewSettingsSchema>;

// passing this to zod through `.default()` is problematic, especially for number fields:
export const defaultPlaygroundSettings: PlaygroundSettings = {
  chartHeight: 100,
  environment: {
    sampleCount: 1000,
    xyPointLength: 1000,
  },
  functionChartSettings: {
    start: functionChartDefaults.min,
    stop: functionChartDefaults.max,
    count: functionChartDefaults.points,
  },
  distributionChartSettings: {
    xScale: "linear",
    yScale: "linear",
    showSummary: true,
  },
  editorSettings: {
    lineWrapping: true,
  },
};

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
  });
  const yScale = scaleTypeToSqScale(settings.yScale);
  return {
    xScale,
    yScale,
    showSummary: settings.showSummary,
    title: settings.title,
  };
}

// settings for the settings form
export type MetaSettings = {
  disableLogX?: boolean;
};

export const EnvironmentForm: React.FC = () => (
  <div className="space-y-4">
    <NumberFormField<PlaygroundSettings>
      name="environment.sampleCount"
      label="Sample Count"
      description="How many samples to use for Monte Carlo simulations. This can occasionally be overridden by specific Squiggle programs."
    />
    <NumberFormField<PlaygroundSettings>
      name="environment.xyPointLength"
      label="Coordinate Count (For PointSet Shapes)"
      description="When distributions are converted into PointSet shapes, we need to know how many coordinates to use."
    />
  </div>
);

export const DistributionSettingsForm: React.FC<{
  metaSettings?: MetaSettings;
}> = ({ metaSettings }) => {
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
              ...(metaSettings?.disableLogX
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

export const EditorSettingsForm: React.FC = () => {
  return (
    <FormSection title="Editor Settings">
      <CheckboxFormField<PlaygroundSettings>
        name="editorSettings.lineWrapping"
        label="Line Wrapping"
      />
    </FormSection>
  );
};

export const PlaygroundSettingsForm: React.FC<{
  withFunctionSettings?: boolean;
  withGlobalSettings?: boolean;
  metaSettings?: MetaSettings;
}> = ({
  withGlobalSettings = true,
  withFunctionSettings = true,
  metaSettings,
}) => {
  return (
    <div className="divide-y divide-gray-200 max-w-2xl">
      {withGlobalSettings && (
        <>
          <div className="mb-6">
            <FormSection title="Rendering Settings">
              <EnvironmentForm />
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
        <DistributionSettingsForm metaSettings={metaSettings} />
      </div>

      {withFunctionSettings ? (
        <div className="pt-6 mb-6">
          <FunctionSettingsForm />
        </div>
      ) : null}

      {withGlobalSettings ? (
        <div className="pt-6 mb-6">
          <EditorSettingsForm />
        </div>
      ) : null}
    </div>
  );
};
