import { FC, ReactNode } from "react";

import { Button, DotsHorizontalIcon, Dropdown, DropdownMenu } from "@quri/ui";

type Props = {
  children: (options: { close(): void }) => ReactNode;
};

// TODO - move to @quri/ui
export const DropdownButton: FC<Props> = ({ children }) => {
  return (
    <Dropdown render={children} tailwindSelector="squiggle-hub">
      <Button>
        <DotsHorizontalIcon className="text-slate-500" />
      </Button>
    </Dropdown>
  );
};
