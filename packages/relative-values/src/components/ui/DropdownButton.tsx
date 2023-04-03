import { FC } from "react";

import { Button } from "./Button";
import { Dropdown } from "./Dropdown";

type Props = {
  text: string;
  children(): React.ReactNode;
};

export const DropdownButton: FC<Props> = ({ text, children }) => {
  return (
    <div className="flex">
      <Dropdown render={children}>
        <Button>{text}</Button>
      </Dropdown>
    </div>
  );
};
