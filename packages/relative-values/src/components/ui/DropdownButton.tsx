import { FC } from "react";

import { Button, Dropdown } from "@quri/ui";
import { tailwindSelector } from "../Tailwind";

type Props = {
  text: string;
  children(): React.ReactNode;
};

export const DropdownButton: FC<Props> = ({ text, children }) => {
  return (
    <div className="flex">
      <Dropdown render={children} tailwindSelector={tailwindSelector}>
        <Button>{text}</Button>
      </Dropdown>
    </div>
  );
};
