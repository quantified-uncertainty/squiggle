import { FC, memo } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { useRunnerState } from "../lib/hooks/useRunnerState.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
  useSquiggle,
} from "../lib/hooks/useSquiggle.js";
import { DynamicSquiggleViewer } from "./DynamicSquiggleViewer.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";

export type SquiggleChartProps = {
  code: string;
  showHeader?: boolean;
  rootPathOverride?: SqValuePath; // Note: This should be static. We don't support rootPathOverride to change once set.
} & (StandaloneExecutionProps | ProjectExecutionProps) &
  // `environment` is passed through StandaloneExecutionProps; this way we guarantee that it's not compatible with `project` prop
  Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleChart: FC<SquiggleChartProps> = memo(
  function SquiggleChart({
    code,
    showHeader = false,
    project,
    continues,
    environment,
    rootPathOverride,
    ...settings
  }) {
    // We go through runnerState to bump executionId on code changes;
    // This is important, for example, in VS Code extension.
    // TODO: maybe `useRunnerState` could be merged with `useSquiggle`, but it does some extra stuff (autorun mode).
    const runnerState = useRunnerState(code);

    const [squiggleOutput, { isRunning }] = useSquiggle({
      code: runnerState.renderedCode,
      executionId: runnerState.executionId,
      ...(project ? { project, continues } : { environment }),
    });

    if (!squiggleOutput) {
      return <RefreshIcon className="animate-spin" />;
    }

    return (
      <DynamicSquiggleViewer
        rootPathOverride={rootPathOverride}
        squiggleOutput={squiggleOutput}
        isRunning={isRunning}
        environment={environment}
        {...settings}
      />
    );
  }
);
