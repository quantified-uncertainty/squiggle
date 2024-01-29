import { FC, memo } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { useSquiggleRunner } from "../lib/hooks/useSquiggleRunner.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
} from "../lib/utility.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { ViewerWithMenuBar } from "./ViewerWithMenuBar/index.js";

// TODO: Right now, rootPathOverride is only used for Export pages on Squiggle Hub. When this happens, we don't want to show the header menu. This combination is awkward, but this interface is annoying to change, given it being in Versioned Components. Consider changing later.

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

    const { squiggleProjectRun } = useSquiggleRunner({
      code,
      setup: project
        ? { type: "project", project, continues }
        : { type: "standalone" },
      environment,
    });

    if (!squiggleProjectRun) {
      return <RefreshIcon className="animate-spin" />;
    }

    return (
      <ViewerWithMenuBar
        squiggleProjectRun={squiggleProjectRun}
        playgroundSettings={settings}
        showMenu={!rootPathOverride}
        randomizeSeed={undefined}
        defaultTab={
          rootPathOverride
            ? {
                tag: "CustomResultPath",
                value: rootPathOverride,
              }
            : undefined
        }
      />
    );
  }
);
