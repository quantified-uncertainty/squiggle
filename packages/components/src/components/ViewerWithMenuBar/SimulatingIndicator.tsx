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
      className={clsx(
        "whitespace-nowrap text-sm font-light",
        _isSimulating ? "text-gray-200" : "text-gray-500"
      )}
    >
      {`Simulation #${simulation.executionId} in ${showTime(
        simulation.executionTime
      )}`}
    </div>
  );
};
