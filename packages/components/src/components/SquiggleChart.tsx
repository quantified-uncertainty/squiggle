import { FC, memo } from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { SquiggleViewer } from "../index.js";
import { useRunnerState } from "../lib/hooks/useRunnerState.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
  useSquiggle,
} from "../lib/hooks/useSquiggle.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { ViewerMenuBar } from "./ViewerMenuBar/index.js";
import { ViewerBody } from "./ViewerMenuBar/ViewerBody.js";

export type SquiggleChartProps = {
  code: string;
  rootPathOverride?: SqValuePath; // Note: This should be static. We don't support rootPathOverride to change once set. Used for Export pages on Squiggle Hub.
} & (StandaloneExecutionProps | ProjectExecutionProps) &
  // `environment` is passed through StandaloneExecutionProps; this way we guarantee that it's not compatible with `project` prop
  Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleChart: FC<SquiggleChartProps> = memo(
  function SquiggleChart({
    code,
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

    // TODO - if `<ViewerProvider>` is not set up (which is very possible) then calculator paths won't be resolved.

    if (!squiggleOutput) {
      return <RefreshIcon className="animate-spin" />;
    }

    if (rootPathOverride) {
      // TODO: It's awkward how this toggle both changes the UI and the data flow. Maybe we should have a separate component for this?

      return (
        <ViewerBody
          output={squiggleOutput.output}
          mode={{ tag: "CustomResultPath", value: rootPathOverride }}
          isRunning={isRunning}
          viewer={(output) => (
            <SquiggleViewer
              value={output}
              environment={environment}
              {...settings}
            />
          )}
        />
      );
    } else {
      return (
        <ViewerMenuBar
          squiggleOutput={squiggleOutput}
          isRunning={isRunning}
          viewer={(output: SqValue) => (
            <SquiggleViewer
              value={output}
              environment={environment}
              {...settings}
            />
          )}
        />
      );
    }
  }
);
