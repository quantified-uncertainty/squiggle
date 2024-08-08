import { FC, ReactNode, useState } from "react";

import { Button, RefreshIcon } from "@quri/ui";

/*
 * This component is useful in MDX documentation when we want to demostrate a
 * stateful component that can be reset to its initial state.
 */
export const Resettable: FC<{
  children: () => ReactNode;
  controls?: () => ReactNode;
  onReset?: () => void;
}> = ({ children, controls, onReset }) => {
  const [id, setId] = useState(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Button
          onClick={() => {
            onReset?.();
            setId((id) => id + 1);
          }}
          size="small"
        >
          <div className="flex items-center gap-1">
            <RefreshIcon size={14} />
            <div>Reset</div>
          </div>
        </Button>
        {controls && controls()}
      </div>
      <div key={id}>{children()}</div>
    </div>
  );
};
