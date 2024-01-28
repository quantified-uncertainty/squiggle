import { FC, memo } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { useRunnerState } from "../lib/hooks/useRunnerState.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
  useSquiggle,
} from "../lib/hooks/useSquiggle.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { defaultMode, ViewerWithMenuBar } from "./ViewerWithMenuBar/index.js";
import { ViewerBody } from "./ViewerWithMenuBar/ViewerBody.js";

export type SquiggleChartProps = {
  code: string;
  rootPathOverride?: SqValuePath; // Note: This should be static. We don't support rootPathOverride to change once set. Used for Export pages on Squiggle Hub.
  showHeader?: boolean;
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
    showHeader = true,
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

    //For now, we don't support the case of rootPathOverride and showHeader both being true.
    const _showHeader = rootPathOverride ? false : showHeader;

    return _showHeader ? (
      <ViewerWithMenuBar
        squiggleOutput={squiggleOutput}
        isRunning={isRunning}
        playgroundSettings={settings}
      />
    ) : (
      <ViewerBody
        output={squiggleOutput.output}
        mode={
          rootPathOverride
            ? { tag: "CustomResultPath", value: rootPathOverride }
            : defaultMode(squiggleOutput.output)
        }
        isRunning={isRunning}
        playgroundSettings={settings}
      />
    );
  }
);
