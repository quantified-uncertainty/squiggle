import { FC } from "react";

import { SquiggleProjectRun } from "../../lib/hooks/useSquiggleProjectRun.js";
import { getIsRunning } from "../../lib/hooks/useSquiggleRunner.js";

export const RenderingIndicator: FC<{
  output: SquiggleProjectRun;
}> = ({ output }) => {
  const isRunning = getIsRunning(output);

  const showTime = (executionTime: number) =>
    executionTime > 1000
      ? `${(executionTime / 1000).toFixed(2)}s`
      : `${executionTime}ms`;

  return (
    <div className=" text-zinc-400 text-sm whitespace-nowrap">
      {isRunning
        ? "rendering..."
        : `render #${output.executionId} in ${showTime(output.executionTime)}`}
    </div>
  );
};
