import { FC, ReactNode } from "react";

import { Button, DotsHorizontalIcon, Dropdown, DropdownMenu } from "@quri/ui";

type Props = {
  children: (options: { close(): void }) => ReactNode;
};

// TODO - move to @quri/ui
export const DotsDropdownButton: FC<Props> = ({ children }) => {
  return (
    <Dropdown render={children}>
      <Button>
        <DotsHorizontalIcon className="text-slate-500" />
      </Button>
    </Dropdown>
  );
};
