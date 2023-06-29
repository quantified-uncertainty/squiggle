import { FC, memo } from "react";

import { RefreshIcon } from "@quri/ui";

import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
  useSquiggle,
} from "../lib/hooks/useSquiggle.js";
import { DynamicSquiggleViewer } from "./DynamicSquiggleViewer.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { useRunnerState } from "../lib/hooks/useRunnerState.js";

type Props = {
  code: string;
  showHeader?: boolean;
  localSettingsEnabled?: boolean;
} & (StandaloneExecutionProps | ProjectExecutionProps) &
  // `environment` is passed through StandaloneExecutionProps; this way we guarantee that it's not compatible with `project` prop
  Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleChart: FC<Props> = memo(function SquiggleChart({
  code,
  showHeader = false,
  localSettingsEnabled,
  project,
  continues,
  environment,
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
      squiggleOutput={squiggleOutput}
      isRunning={isRunning}
      showHeader={showHeader}
      localSettingsEnabled={localSettingsEnabled}
      environment={environment}
      {...settings}
    />
  );
});
