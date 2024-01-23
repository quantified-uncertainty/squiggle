import { FC } from "react";

import { Die3Icon, TextTooltip } from "@quri/ui";

import { SquiggleOutput } from "../../lib/hooks/useSquiggle.js";

export const RenderingIndicator: FC<{
  output: SquiggleOutput;
  isRunning: boolean;
}> = ({ output, isRunning }) => {
  const showTime = (executionTime: number) =>
    executionTime > 1000
      ? `${(executionTime / 1000).toFixed(2)}s`
      : `${executionTime}ms`;

  return (
    <div className="flex items-center">
      <div className=" text-zinc-400 text-sm whitespace-nowrap">
        {isRunning
          ? "rendering..."
          : `render #${output.executionId} in ${showTime(
              output.executionTime
            )}`}
      </div>
      <TextTooltip
        text={"Re-run calculations with a random seed"}
        placement="bottom"
        offset={5}
      >
        <div className="ml-1 px-1 cursor-pointer group">
          <Die3Icon
            size={16}
            className="text-violet-300 group-hover:text-violet-800 "
          />
        </div>
      </TextTooltip>
    </div>
  );
};
