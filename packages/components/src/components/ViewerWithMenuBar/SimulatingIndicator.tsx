import clsx from "clsx";
import { FC } from "react";

import { isSimulating, Simulation } from "../../lib/hooks/useSimulator.js";

export const SimulatingIndicator: FC<{
  simulation: Simulation;
}> = ({ simulation }) => {
  const _isSimulating = isSimulating(simulation);

  const showTime = (executionTime: number) =>
    executionTime > 1000
      ? `${(executionTime / 1000).toFixed(2)}s`
      : `${executionTime}ms`;

  return (
    <div
      // Stable hooks for apps that show the run time elsewhere (Squiggle
      // Studio hides this) or wait for the run to finish.
      data-simulation-indicator=""
      data-running={_isSimulating ? "1" : "0"}
      className={clsx(
        "whitespace-nowrap text-sm",
        _isSimulating ? "text-zinc-200" : "text-zinc-500"
      )}
    >
      {`simulation #${simulation.executionId} in ${showTime(
        simulation.output.executionTime
      )}`}
    </div>
  );
};
