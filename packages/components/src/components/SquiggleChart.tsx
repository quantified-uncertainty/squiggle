import { FC, memo } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { SquiggleViewer } from "../index.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
  useSquiggleRunner,
} from "../lib/hooks/useSquiggleRunner.js";
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

    // const _env = useMemo(() => {
    //   return {
    //     ...(environment ?? {
    //       sampleCount: DEFAULT_SAMPLE_COUNT,
    //       xyPointLength: DEFAULT_XY_POINT_LENGTH,
    //     }),
    //     seed,
    //   };
    // }, [environment, seed]);

    const { squiggleOutput, viewerTab, setViewerTab, seed, setSeed } =
      useSquiggleRunner({
        code,
        ...(project ? { project, continues } : { environment }),
      });

    // TODO - if `<ViewerProvider>` is not set up (which is very possible) then calculator paths won't be resolved.
    const getSubvalueByPath = useGetSubvalueByPath();

    if (!squiggleOutput) {
      return <RefreshIcon className="animate-spin" />;
    }

    if (rootPathOverride) {
      const { output } = squiggleOutput;
      if (!output.ok) {
        return <SquiggleErrorAlert error={output.value} />;
      }
      const rootValue =
        rootPathOverride.root === "result"
          ? output.value.result
          : output.value.bindings.asValue();

      const value = getSubvalueByPath(rootValue, rootPathOverride);
      if (value) {
        return <SquiggleViewer value={value} />;
      } else {
        return <MessageAlert heading="Value is not defined" />;
      }
    } else {
      return (
        <SquiggleOutputViewer
          squiggleOutput={squiggleOutput}
          environment={environment}
          seed={seed}
          setSeed={setSeed}
          viewerTab={viewerTab}
          setViewerTab={setViewerTab}
          {...settings}
        />
      );
    }
  }
);
