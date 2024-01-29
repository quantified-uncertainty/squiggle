import { FC } from "react";

import {
  isRunning,
  SquiggleProjectRun,
} from "../../lib/hooks/useSquiggleProjectRun.js";

export const RenderingIndicator: FC<{
  projectRun: SquiggleProjectRun;
}> = ({ projectRun }) => {
  const _isRunning = isRunning(projectRun);

  const showTime = (executionTime: number) =>
    executionTime > 1000
      ? `${(executionTime / 1000).toFixed(2)}s`
      : `${executionTime}ms`;

  return (
    <div className="text-zinc-400 text-sm whitespace-nowrap">
      {_isRunning
        ? "rendering..."
        : `render #${projectRun.executionId} in ${showTime(
            projectRun.executionTime
          )}`}
    </div>
  );
};
