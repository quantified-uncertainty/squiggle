import { FC, memo } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { SquiggleViewer } from "../index.js";
import { useRunnerState } from "../lib/hooks/useRunnerState.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
  useSquiggle,
} from "../lib/hooks/useSquiggle.js";
import { getResultValue, getResultVariables } from "../lib/utility.js";
import { MessageAlert } from "./Alert.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { SquiggleErrorAlert } from "./SquiggleErrorAlert.js";
import { SquiggleOutputViewer } from "./SquiggleOutputViewer/index.js";
import { useGetSubvalueByPath } from "./SquiggleViewer/utils.js";

export type SquiggleChartProps = {
  code: string;
  rootPathOverride?: SqValuePath; // Note: This should be static. We don't support rootPathOverride to change once set.
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
    const getSubvalueByPath = useGetSubvalueByPath();

    if (!squiggleOutput) {
      return <RefreshIcon className="animate-spin" />;
    }

    if (rootPathOverride) {
      const rootValue =
        rootPathOverride.root === "result"
          ? getResultValue(squiggleOutput)
          : getResultVariables(squiggleOutput);
      if (!rootValue) {
        return <MessageAlert heading="Value is not defined" />;
      }
      if (!rootValue.ok) {
        return <SquiggleErrorAlert error={rootValue.value} />;
      }

      const value = getSubvalueByPath(rootValue.value, rootPathOverride);
      if (!value) {
        return <MessageAlert heading="Value is not defined" />;
      }

      return <SquiggleViewer value={{ ok: true, value }} />;
    } else {
      return (
        <SquiggleOutputViewer
          squiggleOutput={squiggleOutput}
          isRunning={isRunning}
          environment={environment}
          {...settings}
        />
      );
    }
  }
);
