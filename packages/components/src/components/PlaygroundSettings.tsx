import { FC } from "react";
import { z } from "zod";

import { defaultRunnerName, RunnerName, SqScale } from "@quri/squiggle-lang";
import {
  CheckboxFormField,
  NumberFormField,
  RadioFormField,
  SelectFormField,
  TextFormField,
  WrenchIcon,
} from "@quri/ui";

import { SAMPLE_COUNT_MAX, SAMPLE_COUNT_MIN } from "../lib/constants.js";
import { functionChartDefaults } from "../widgets/LambdaWidget/FunctionChart/utils.js";
import { FormComment } from "./ui/FormComment.js";
import { FormSection } from "./ui/FormSection.js";
import { useWatch } from "react-hook-form";

export const environmentSchema = z.object({
  sampleCount: z.number().int().gte(SAMPLE_COUNT_MIN).lte(SAMPLE_COUNT_MAX),
  xyPointLength: z.number().int().gte(10).lte(10000),
  seed: z.string(),
});

const runnerSchema = z.union([
  z.literal("embedded" satisfies RunnerName),
  z.literal("web-worker" satisfies RunnerName),
  z.literal("embedded-with-serialization" satisfies RunnerName),
]);

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
  args: { min?: number; max?: number; tickFormat?: string } = {}
) {
  switch (scaleType) {
    case "linear":
    case "log":
    case "symlog":
      return new SqScale({ method: { type: scaleType }, ...args });
    case "exp":
      return new SqScale({ method: { type: "power" }, ...args });
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
  runner: runnerSchema,
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
    seed: "default_seed",
  },
  runner: defaultRunnerName,
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
  settings: z.infer<typeof distributionSettingsSchema>,
  xTickFormat?: string
) {
  const xScale = scaleTypeToSqScale(settings.xScale, {
    min: settings.minX,
    max: settings.maxX,
    tickFormat: xTickFormat,
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

const SelectRunnerField: FC = () => {
  const runner = useWatch<PlaygroundSettings, "runner">({ name: "runner" });

  type Option = { value: RunnerName; label: string };

  const options: Option[] = [
    { value: "embedded", label: "Embedded" },
    { value: "web-worker", label: "Web Worker (experimental)" },
    {
      value: "embedded-with-serialization",
      label: "Embedded with serialization check (experimental)",
    },
  ];

  return (
    <div>
      <SelectFormField<PlaygroundSettings, RunnerName, Option>
        name="runner"
        label="Squiggle Runner (Experimental)"
        size="small"
        options={options}
        optionToFieldValue={(option) => option.value}
        fieldValueToOption={(value) =>
          options.find((o) => o.value === value) ?? null
        }
        renderOption={(option) => <div className="text-sm">{option.label}</div>}
        required
      />
      {runner === "embedded" && (
        <FormComment>
          <p>
            This runner runs all Squiggle code in the main browser thread. This
            can cause the UI to freeze during long-running simulations.
          </p>
        </FormComment>
      )}
      {runner === "web-worker" && (
        <FormComment>
          <p className="pb-2 pt-1">
            <WrenchIcon className="mr-1 inline" size={14} />
            This runner is <strong>experimental</strong>.
          </p>
          <p className="pb-2">
            Risks involved: out-of-memory errors; responses arriving in wrong
            order; bugs in serialization code when we return values from the
            worker to the main thread.
          </p>
          <p>
            The main benefit is that the UI won&apos;t be blocked during
            long-running computations.
          </p>
        </FormComment>
      )}
      {runner === "embedded-with-serialization" && (
        <FormComment>
          <p>
            <WrenchIcon className="mr-1 inline" size={14} />
            This runner is only useful for debugging. It works in the same way
            as the embedded runner, but it serializes and then deserializes each
            result to check for bugs in serialization code.
          </p>
        </FormComment>
      )}
    </div>
  );
};

export const RenderingSettingsForm: FC = () => {
  return (
    <div className="space-y-4">
      <TextFormField<PlaygroundSettings>
        name="environment.seed"
        label="Random Seed"
        description="Seed for random number generation. All random functions ultimately are dependent on this value."
      />
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
      <SelectRunnerField />
    </div>
  );
};

export const DistributionSettingsForm: FC<{
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

export const FunctionSettingsForm: FC = () => {
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

export const EditorSettingsForm: FC = () => {
  return (
    <FormSection title="Editor Settings">
      <CheckboxFormField<PlaygroundSettings>
        name="editorSettings.lineWrapping"
        label="Line Wrapping"
      />
    </FormSection>
  );
};

export const PlaygroundSettingsForm: FC<{
  withFunctionSettings?: boolean;
  withGlobalSettings?: boolean;
  metaSettings?: MetaSettings;
}> = ({
  withGlobalSettings = true,
  withFunctionSettings = true,
  metaSettings,
}) => {
  return (
    <div className="max-w-2xl divide-y divide-gray-200">
      {withGlobalSettings && (
        <>
          <div className="mb-6">
            <FormSection title="Rendering Settings">
              <RenderingSettingsForm />
            </FormSection>
          </div>

          <div className="mb-6 pt-6">
            <FormSection title="General Display Settings">
              <NumberFormField<PlaygroundSettings>
                name="chartHeight"
                label="Chart Height (in pixels)"
              />
            </FormSection>
          </div>
        </>
      )}

      <div className="mb-6 pt-6">
        <DistributionSettingsForm metaSettings={metaSettings} />
      </div>

      {withFunctionSettings ? (
        <div className="mb-6 pt-6">
          <FunctionSettingsForm />
        </div>
      ) : null}

      {withGlobalSettings ? (
        <div className="mb-6 pt-6">
          <EditorSettingsForm />
        </div>
      ) : null}
    </div>
  );
};
