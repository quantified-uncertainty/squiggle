import { FC, ReactNode } from "react";

import { Button, DotsHorizontalIcon, Dropdown } from "@quri/ui";

type Props = {
  children: (options: { close(): void }) => ReactNode;
};

export const DotsDropdown: FC<Props> = ({ children }) => {
  return (
    <Dropdown render={children} tailwindSelector="squiggle-hub">
      <Button>
        <DotsHorizontalIcon className="text-slate-500" />
      </Button>
    </Dropdown>
  );
};
