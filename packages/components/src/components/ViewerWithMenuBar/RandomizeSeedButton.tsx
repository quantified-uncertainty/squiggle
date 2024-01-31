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

function stringToRandomNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  return (hash % 6) + 1;
}

const DiceIcon: FC<{ side: number; isSimulating: boolean }> = ({
  side,
  isSimulating,
}) => {
  const props = {
    size: 16,
    className: clsx(
      isSimulating
        ? "animate-spin text-violet-400 group-hover:text-violet-900"
        : "text-violet-200 group-hover:text-violet-500"
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

export const RandomizeSeedButton: FC<{
  isSimulating: boolean;
  seed: string;
  randomizeSeed: () => void;
}> = ({ isSimulating, randomizeSeed, seed }) => {
  return (
    <TextTooltip
      text={`Re-run calculations with a random seed. Current seed: ${seed}`}
      placement="bottom"
      offset={5}
    >
      <div className="ml-1 px-1 cursor-pointer group" onClick={randomizeSeed}>
        <DiceIcon
          side={stringToRandomNumber(seed)}
          isSimulating={isSimulating}
        />
      </div>
    </TextTooltip>
  );
};
