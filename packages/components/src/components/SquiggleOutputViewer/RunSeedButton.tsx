import clsx from "clsx";
import { FC } from "react";

import {
  Die1Icon,
  Die2Icon,
  Die3Icon,
  Die4Icon,
  Die5Icon,
  Die6Icon,
  TextTooltip,
} from "@quri/ui";

import { RunnerState } from "../../lib/hooks/useRunnerState.js";

function deterministicRandom(n: number): number {
  // A more complex hash function
  let hash = n;
  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >> 16) ^ hash;

  // Using modulus to ensure the result is in the range 1-6
  const result = (Math.abs(hash) % 6) + 1;
  return result;
}

const DiceIcon: FC<{ side: number; isRunning: boolean }> = ({
  side,
  isRunning,
}) => {
  const props = {
    size: 16,
    className: clsx(
      isRunning
        ? "animate-spin text-violet-200 group-hover:text-violet-500"
        : "text-violet-300 group-hover:text-violet-800"
    ),
  };
  switch (side) {
    case 1:
      return <Die1Icon {...props} />;
    case 2:
      return <Die2Icon {...props} />;
    case 3:
      return <Die3Icon {...props} />;
    case 4:
      return <Die4Icon {...props} />;
    case 5:
      return <Die5Icon {...props} />;
    case 6:
      return <Die6Icon {...props} />;
    default: {
      throw new Error(`Invalid side: ${side}`);
    }
  }
};

export const RunSeedButton: FC<{
  runnerState: RunnerState;
  isRunning: boolean;
}> = ({ runnerState, isRunning }) => {
  return (
    <TextTooltip
      text={"Re-run calculations with a random seed"}
      placement="bottom"
      offset={5}
    >
      <div className="ml-1 px-1 cursor-pointer group" onClick={runnerState.run}>
        <DiceIcon
          side={deterministicRandom(runnerState.executionId)}
          isRunning={isRunning}
        />
      </div>
    </TextTooltip>
  );
};
