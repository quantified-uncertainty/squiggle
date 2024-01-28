import { FC, memo } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { isRunning } from "../lib/hooks/useSquiggleProjectRun.js";
import { useSquiggleRunner } from "../lib/hooks/useSquiggleRunner.js";
import {
  defaultViewerTab,
  ProjectExecutionProps,
  StandaloneExecutionProps,
} from "../lib/utility.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { ViewerWithMenuBar } from "./ViewerWithMenuBar/index.js";
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

    const { squiggleProjectRun, viewerTab, setViewerTab } = useSquiggleRunner({
      code,
      setup: project
        ? { type: "project", project, continues }
        : { type: "standalone", environment },
    });

    if (!squiggleProjectRun) {
      return <RefreshIcon className="animate-spin" />;
    }

    //For now, we don't support the case of rootPathOverride and showHeader both being true.
    const _showHeader = rootPathOverride ? false : showHeader;

    return _showHeader ? (
      <ViewerWithMenuBar
        squiggleProjectRun={squiggleProjectRun}
        viewerTab={viewerTab}
        setViewerTab={setViewerTab}
        playgroundSettings={settings}
      />
    ) : (
      <ViewerBody
        output={squiggleProjectRun.output}
        viewerTab={
          rootPathOverride
            ? { tag: "CustomResultPath", value: rootPathOverride }
            : defaultViewerTab(squiggleProjectRun.output)
        }
        isRunning={isRunning(squiggleProjectRun)}
        playgroundSettings={settings}
      />
    );
  }
);
